import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { Response } from '../../helpers/response'
import { authorizerCacheTime } from "../../helpers/cache-ages";
import { Context } from "../../models";
import { allowedMethods } from "./types";

const unauthorizedResponse = new Response({
    statusCode: 403,
    message: 'ACCESS_DENIED',
}).response

const authorizedResponse = new Response({
    statusCode: 200,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${authorizerCacheTime}`,
    },
}).response

export const authorizer = async (context: Context) => {
    const { methodName } = context

    return authorizedResponse
}