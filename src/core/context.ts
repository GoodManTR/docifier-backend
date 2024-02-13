import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { FirebaseApp } from './firebase';
import { z } from 'zod'
import { verify } from 'jsonwebtoken';
import { getVerifyOptionsWithMaxAge } from './archives/common.archive';
import { AccessTokenPayload } from './models/auth.model';
import { CustomError } from './packages/error-response';

const { ACCESS_TOKEN_SECRET } = process.env

export const tokenMetaData = z.object({
  identity: z.string(),
  userId: z.string(),
})
export type TokenMetaData = z.infer<typeof tokenMetaData>

export async function createContext(event: APIGatewayProxyEventV2) {
  const params = event.pathParameters?.proxy?.split('/') || []
  
  const action = params[0];
  const classId = params[1];
  const methodName = params[2];
  const instanceId: string | undefined = action === 'CALL' ? params[3] : params[2]
  
  const token = event.headers['_token'] as string
  let identity: string, isAnonymous: boolean, userId: string, claims: any, sessionId: string | undefined
  if (token) {
    try {
      const res = verify(token, ACCESS_TOKEN_SECRET!, getVerifyOptionsWithMaxAge()) as AccessTokenPayload
      identity = res.identity
      isAnonymous = res.anonymous
      userId = res.userId
      claims = res.claims
      sessionId = res.sessionId
    } catch (error) {
      throw new CustomError('System', 1000, 403, { issues: 'Your access token is invalid or expired' }).friendlyResponse
    }
  } else {
    identity = 'anonymous'
    isAnonymous = true
    userId = 'anonymous'
    claims = {}
  }


  return {
    classId,
    methodName,
    instanceId,
    headers: event.headers,
    isAnonymous,
    requestId: event.requestContext.requestId,
    identity,
    userId,
    userIP: event.requestContext.http.sourceIp,
    sourceIp: event.requestContext.http.sourceIp,
    claims,
    sessionId,
  }
}
