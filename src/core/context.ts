import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { Context, TokenMetaData } from '../models'
import { firebaseApp } from '../api'

export async function createContext(event: APIGatewayProxyEventV2) {
  const params = event.pathParameters?.proxy?.split('/') || []
  const action = params[0];
  const classId = params[1];
  const methodName = params[2];
  const instanceId: string | undefined = action === 'CALL' ? params[3] : params[2]

  const token = event.headers['_token'] as string
  let tokenMetaData: TokenMetaData
  let claims: any
  if (token) {
    const firebaseToken = await firebaseApp.auth().verifyIdToken(token)
    tokenMetaData = {
      userType: firebaseToken.userType,
      userId: firebaseToken.uid,
    }
    claims = firebaseToken
  } else {
    tokenMetaData = {
      userType: 'none',
      userId: 'none',
    }
    claims = {}
  }

  const { userType = 'none', userId = 'none' } = tokenMetaData

  return {
    classId,
    methodName,
    instanceId,
    identity: userType,
    userId,
    userIP: event.requestContext.http.sourceIp,
    sourceIp: event.requestContext.http.sourceIp,
    claims,
  } as Context
}
