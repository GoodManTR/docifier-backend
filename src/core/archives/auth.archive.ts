import { decode, JwtPayload, sign, verify } from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand, QueryCommandInput, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { anonymousIdentity, AuthDDBItem, AuthResponse, AuthWithCustomTokenInput, GenerateCustomTokenOperation, RefreshTokenInput, SignOutInput } from 'core/models/auth.model'
import { EnvironmentVariables, FirebaseApp } from 'core/firebase'
import crypto from 'crypto'
import { GENERAL_TABLE } from 'core/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getVerifyOptionsWithMaxAge } from './common.archive'

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, CUSTOM_TOKEN_SECRET, FIREBASE_PROJECT_ID, FIREBASE_API_KEY } = process.env

const dynamodb = new DynamoDBClient({})
const ddb = DynamoDBDocumentClient.from(dynamodb)

const accessTokenExpire = 300
const refreshTokenExpire = 86400 * 15
const maxRefreshTokenCount = 3

async function generateAccessToken(userId: string, identity: string, sessionId: string, claims = {}): Promise<AuthResponse> {
  const isAnonymous = userId.startsWith('anonymous_')
  identity = isAnonymous ? anonymousIdentity : identity

  const tokenData = { identity, anonymous: isAnonymous, userId, claims, sessionId }
  const firebase = new FirebaseApp()

  return {
    accessToken: sign(tokenData, ACCESS_TOKEN_SECRET!, { expiresIn: accessTokenExpire }),
    refreshToken: sign(tokenData, REFRESH_TOKEN_SECRET!, { expiresIn: refreshTokenExpire }),
    firebase: {
      customToken: await firebase.generateClientToken(userId, { role: identity }),
      projectId: FIREBASE_PROJECT_ID!,
      apiKey: FIREBASE_API_KEY!,
      envs: EnvironmentVariables.firebaseEnvs,
    },
  }
}

function getAuthPrimaryKey(userId: string): string {
  return ['AU', userId].join('#')
}

function getAuthSecondaryKey(identity: string, sessionId?: string, refreshToken?: string): string {
  const parts = [identity]
  if (sessionId) parts.push(sessionId)
  if (sessionId && refreshToken) parts.push(crypto.createHash('md5').update(refreshToken).digest('hex'))

  return parts.join('#')
}

function parseSecondaryKey(sort: string) {
  const [identity, sessionId, refreshToken] = sort.split('#')
  return { sessionId }
}

async function getRefreshTokens(partKey: string, identity?: string, sessionId?: string): Promise<AuthDDBItem[]> {
  const queryInput: QueryCommandInput = {
    TableName: GENERAL_TABLE,
    KeyConditionExpression: '#part = :part',
    ExpressionAttributeNames: {
      '#part': 'part',
      '#expiresAt': 'expiresAt',
    },
    ExpressionAttributeValues: {
      ':part': partKey,
      ':now': Math.floor(Date.now() / 1000),
    },
    FilterExpression: '#expiresAt > :now',
  }
  if (identity) {
    queryInput.ExpressionAttributeNames!['#sort'] = 'sort'
    queryInput.ExpressionAttributeValues![':bw'] = getAuthSecondaryKey(identity, sessionId)
    queryInput.KeyConditionExpression! += ' AND begins_with(#sort, :bw)'
  }
  const { Items } = await ddb.send(new QueryCommand(queryInput))
  return (Items || []) as AuthDDBItem[]
}

export const getExpiredRefreshTokens = (refreshTokens: AuthDDBItem[], maxRefreshTokenCount: number): AuthDDBItem[] =>
  refreshTokens.sort((a, b) => b.expiresAt - a.expiresAt).slice(maxRefreshTokenCount)

export async function authWithCustomToken(customToken: string) {
  const { userId, claims, identity } = verify(customToken, CUSTOM_TOKEN_SECRET!) as JwtPayload
  const sessionId = uuid().replace(/-/g, '')
  const { accessToken, refreshToken, firebase } = await generateAccessToken(userId, identity, sessionId, claims)

  const isAnonymous = userId.startsWith('anonymous_')
  const tokenData = {
    isAnonymous,
    claims,
    identity,
    userId,
    sessionId,
  }

  if (isAnonymous) return { response: { accessToken, refreshToken, firebase }, tokenData }

  const { exp } = decode(refreshToken) as JwtPayload
  await ddb.send(
    new PutCommand({
      TableName: GENERAL_TABLE,
      Item: {
        part: getAuthPrimaryKey(userId),
        sort: getAuthSecondaryKey(identity, sessionId, refreshToken),
        refreshToken,
        expiresAt: exp,
      },
    }),
  )

  return { response: { accessToken, refreshToken, firebase }, tokenData }
}

export async function refreshToken(currentRefreshToken: string) {
  const { sessionId, userId, claims, identity, anonymous } = verify(currentRefreshToken, ACCESS_TOKEN_SECRET!) as JwtPayload

  const { accessToken, refreshToken: newRefreshToken, firebase } = await generateAccessToken(userId, identity, sessionId, claims)
  const tokenData = {
    isAnonymous: anonymous,
    claims,
    identity,
    userId,
    sessionId,
  }
  if (anonymous) {
    return { response: { accessToken, refreshToken: newRefreshToken, firebase }, tokenData }
  }

  const partKey = getAuthPrimaryKey(userId)
  const refreshTokens = await getRefreshTokens(partKey, identity, sessionId)

  if (!refreshTokens.find((r) => r.refreshToken === currentRefreshToken)) {
    throw new Error('invalid refresh token')
  }

  const expiredRefreshTokens = getExpiredRefreshTokens(refreshTokens, maxRefreshTokenCount)

  const { exp } = decode(newRefreshToken) as JwtPayload
  const newRefreshTokenItem: AuthDDBItem = {
    part: partKey,
    sort: getAuthSecondaryKey(identity, sessionId, newRefreshToken),
    refreshToken: newRefreshToken,
    expiresAt: exp!,
  }
  const { UnprocessedItems } = await ddb.send(
    new BatchWriteCommand({
      RequestItems: {
        [GENERAL_TABLE]: [
          {
            PutRequest: {
              Item: newRefreshTokenItem,
            },
          },
          ...expiredRefreshTokens.map(({ part, sort }) => ({
            DeleteRequest: {
              Key: {
                part,
                sort,
              },
            },
          })),
        ],
      },
    }),
  )
  if (UnprocessedItems && UnprocessedItems[GENERAL_TABLE] && UnprocessedItems[GENERAL_TABLE].find((i) => i.PutRequest?.Item?.refreshToken === newRefreshToken)) {
    // Retry once
    await ddb
      .send(
        new PutCommand({
          TableName: GENERAL_TABLE,
          Item: newRefreshTokenItem,
        }),
      )
      .catch((e) => console.log('retry failed', e))
  }

  return { response: { accessToken, refreshToken: newRefreshToken, firebase }, tokenData }
}

export async function signOut(identity: string, userId: string, accessToken: string) {
  const { sessionId, exp } = verify(accessToken, ACCESS_TOKEN_SECRET!, getVerifyOptionsWithMaxAge()) as JwtPayload
  const refreshTokens = await getRefreshTokens(getAuthPrimaryKey(userId), identity, sessionId)

  if (!refreshTokens.length) return

  await ddb.send(
      new TransactWriteCommand({
          TransactItems: refreshTokens.map(({ part, sort }) => ({
              Delete: {
                  TableName: GENERAL_TABLE,
                  Key: {
                      part,
                      sort,
                  },
              },
          })),
      }),
  )
}

export async function generateCustomToken(body: GenerateCustomTokenOperation): Promise<string> {
  const { userId, claims } = body

  const isAnonymous = userId.startsWith('anonymous_')
  if (isAnonymous) {
      throw new Error('cannot generate custom token')
  }

  const identity = isAnonymous ? anonymousIdentity : body.identity
  const tokenData = { identity, anonymous: isAnonymous, userId, claims }
  return sign(tokenData, CUSTOM_TOKEN_SECRET!, { expiresIn: 300 })
}