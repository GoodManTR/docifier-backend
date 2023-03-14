import { sign, verify as JWTVerify } from 'jsonwebtoken'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'

import { TokenMetaData, ValidateTokenResponse, tokenMetaData } from './types'
import { ExaminatorResponse, Response } from '../../helpers/response'
import { Context } from '../../models'

const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = process.env
const ACCESS_TOKEN_TTL = 300
const REFRESH_TOKEN_TTL = 600
const SESSION_TABLE = 'SessionTable'

const client = new DynamoDBClient({})

const dynamo = DynamoDBDocumentClient.from(client)

// *******************************
// *******************************
// *********** TOKEN *************
// *******************************
// *******************************

export const validateToken = (token: string, secret: string): ValidateTokenResponse => {
    try {
      if (!secret || !token) {
        throw new Response({ statusCode: 403, message: 'There has been problem whit your token',  addons: { errorCode: 0xff897 } })
      }
  
      return { tokenMetaData: JWTVerify(token, secret) as TokenMetaData }
    } catch (error) {
      return {
        error: 'There has been problem whit your token',
      }
    }
  }
  
  // *******************************
  // *******************************
  // ********** SESSION ************
  // *******************************
  // *******************************
  
  export const createSession = async ({ userId, userType }: any, IP: string) => {
    const tokenData: TokenMetaData = {
      userType,
      userId,
      IP,
    }
  
    const accessToken = sign(tokenData, ACCESS_TOKEN_SECRET!, { expiresIn: ACCESS_TOKEN_TTL })
    const refreshToken = sign(tokenData, REFRESH_TOKEN_SECRET!, { expiresIn: REFRESH_TOKEN_TTL })
  
    await dynamo.send(
      new PutCommand({
        TableName: SESSION_TABLE,
        Item: {
          userId,
          accessToken,
          refreshToken,
          expiresAt: Date.now() + REFRESH_TOKEN_TTL * 1000,
        },
      }),
    )
  
    return { accessToken, refreshToken }
  }
  
  export const terminateSession = async (_token: string, targetUserId: string): Promise<void> => {
    const { tokenMetaData, error } = validateToken(_token, ACCESS_TOKEN_SECRET!)
  
   if (error) {
     throw new Response({ statusCode: 403, message: 'There has been a problem while authorizing your token.', addons: { tokenError: error } })
   }
  
   if (tokenMetaData!.userId !== targetUserId && tokenMetaData!.userType !== 'admin') {
     throw new Response({ statusCode: 403, message: 'You are not authorized to terminate this session.' })
   }
  
   const dynamoReq = await dynamo.send(
     new DeleteCommand({
       TableName: SESSION_TABLE,
       Key: {
         userId: targetUserId,
       },
     }),
   )
  
   if (!dynamoReq.$metadata || dynamoReq.$metadata.httpStatusCode !== 200) {
     throw new Response({ statusCode: 404, message: 'There has been a problem while terminating your session.' })
   }
  }
  
  export const validateSessionToken = async (_token: string, secret: string): Promise<TokenMetaData> => {
    const { tokenMetaData, error } = validateToken(_token, secret)
  
    if (error) {
      throw new Response({ statusCode: 403, message: 'There has been a problem while authorizing your token.', addons: { tokenError: error } })
    }
  
    const dynamoReq = await dynamo.send(
      new GetCommand({
        TableName: SESSION_TABLE,
        Key: {
          userId: tokenMetaData!.userId,
        },
      }),
    )
  
    if (!dynamoReq.Item || (dynamoReq.Item.accessToken !== _token && dynamoReq.Item.refreshToken !== _token)) {
      throw new Response({ statusCode: 403, message: 'There has been a problem while validating your token.' })
    }
  
    return tokenMetaData!
  }
  
  // *******************************
  // *******************************
  // ***** LAMBDA HANDLERS  ********
  // *******************************
  // *******************************
  
  
  export const refreshToken = async (context: Context): Promise<ExaminatorResponse> => {
    try {
      const _token = context.headers['_token'] // refresh token
      const reqIP = context.sourceIp
  
      const tokenMetaData = await validateSessionToken(_token!, REFRESH_TOKEN_SECRET!)
      
      if (tokenMetaData.IP !== reqIP) {
        throw new Response({ statusCode: 403, message: 'Token is not created with same IP' })
      }
  
      const { userId, userType } = tokenMetaData
  
      const { accessToken, refreshToken } = await createSession({ userId, userType }, reqIP)
  
      return new Response({ statusCode: 200, body: { accessToken, refreshToken } }).response
    } catch (error) {
      return error instanceof Response ? error.response : new Response({ statusCode: 400, message: 'Generic Error', addons: { error: error } }).response
    }
  }
  