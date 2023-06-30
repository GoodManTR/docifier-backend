import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { authorizerCacheTime } from "../../helpers/cache-ages";
import { Context } from "../../models";
import { userTypes } from "../../types";
import { SuccessResponse } from "../../helpers/response-manager";

const unauthorizedResponse = new SuccessResponse({
    statusCode: 403,
    body: { message:'ACCESS_DENIED' },
}).response

const authorizedResponse = new SuccessResponse({
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${authorizerCacheTime}`,
    },
}).response

export const authorizer = async (context: Context) => {
    const  { methodName, identity } = context

    return authorizedResponse
}