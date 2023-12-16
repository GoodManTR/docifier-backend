import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { FirebaseApp } from './firebase';
import { z } from 'zod'

export const tokenMetaData = z.object({
  identity: z.string(),
  userId: z.string(),
})
export type TokenMetaData = z.infer<typeof tokenMetaData>

export async function createContext(event: APIGatewayProxyEventV2) {
  const firebase = new FirebaseApp()

  const params = event.pathParameters?.proxy?.split('/') || []
  
  const action = params[0];
  const classId = params[1];
  const methodName = params[2];
  const instanceId: string | undefined = action === 'CALL' ? params[3] : params[2]

  let tokenMetaData: TokenMetaData
  
  const token = event.headers['_token'] as string
  let claims: any
  if (token) {
    try {
      const firebaseToken = await firebase.validateClientToken(token)
      tokenMetaData = {
        identity: firebaseToken.identity,
        userId: firebaseToken.uid,
      }
      claims = firebaseToken
    } catch (error) {
      tokenMetaData = {
        identity: 'none',
        userId: 'none',
      }
      claims = {}
    }
  } else {
    tokenMetaData = {
      identity: 'none',
      userId: 'none',
    }
    claims = {}
  }

  const { identity = 'none', userId = 'none' } = tokenMetaData

  return {
    classId,
    methodName,
    instanceId,
    headers: event.headers,
    requestId: event.requestContext.requestId,
    identity,
    userId,
    userIP: event.requestContext.http.sourceIp,
    sourceIp: event.requestContext.http.sourceIp,
    claims,
  }
}
