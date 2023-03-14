import { APIGatewayProxyEventV2 } from "aws-lambda";
import { verify as JWTVerify } from 'jsonwebtoken'
import { TokenMetaData } from "../classes/Auth/types";
import { Context } from "../models";

const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = process.env

export function createContext(event: APIGatewayProxyEventV2) {
    const path = event.rawPath.split('/').slice(3).join('/')
    const methodName = event.rawPath.split('/')[2]

    let tokenMetaData: TokenMetaData

    if (event.headers['_token']) {
        tokenMetaData = JWTVerify(event.headers['_token'] as string, ACCESS_TOKEN_SECRET!) as unknown as TokenMetaData
    } else {
        tokenMetaData = {
            userType: 'none',
            userId: 'none',
            IP: 'none'
        }
    }

    const identity = tokenMetaData.userType  || 'none'
    const userId = tokenMetaData.userId || 'none'
    const userIP = tokenMetaData.IP || 'none'

    let queryStringParameters = event.queryStringParameters || {}
    if (event.queryStringParameters && event.queryStringParameters['data'] && event.queryStringParameters['__isbase64']) {
        const base64Data = event.queryStringParameters['data']
        const jsonString = Buffer.from(base64Data, 'base64').toString('utf8')
        queryStringParameters = JSON.parse(jsonString);
    } 

    let requestBody = event.body ? JSON.parse(event.body) : {}

    return {
        path,
        methodName,
        identity,
        userId,
        userIP,
        sourceIp: event.requestContext.http.sourceIp,
        queryStringParameters,
        headers: event.headers,
        httpMethod: event.requestContext.http.method,
        body: requestBody,
    } as Context
} 