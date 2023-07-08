import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { Context, TokenMetaData } from '../../models'
import { firebaseApp } from '../../api'

export async function createContext(event: APIGatewayProxyEventV2) {
  const path = event.rawPath.split('/').slice(3).join('/')
  const methodName = event.rawPath.split('/')[2]

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

  let queryStringParameters = event.queryStringParameters ?? {}
  if (event.queryStringParameters?.['data'] && event.queryStringParameters?.['__isbase64']) {
    const base64Data = event.queryStringParameters['data']
    const jsonString = Buffer.from(base64Data, 'base64').toString('utf8')
    queryStringParameters = JSON.parse(jsonString)
  }

  const requestBody = event.body ? JSON.parse(event.body) : {}

  return {
    path,
    methodName,
    identity: userType,
    userId,
    userIP: event.requestContext.http.sourceIp,
    sourceIp: event.requestContext.http.sourceIp,
    queryStringParameters,
    headers: event.headers,
    httpMethod: event.requestContext.http.method,
    body: requestBody,
    claims,
  } as Context
}
