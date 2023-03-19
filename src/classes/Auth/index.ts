import { APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { authorizerCacheTime } from "../../helpers/cache-ages";
import { Context } from "../../models";
import { allowedMethods, enduserAllowedMethods, methods } from "./types";
import { userTypes } from "../../types";

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

    if (allowedMethods.enum[methodName]) return authorizedResponse
    if (enduserAllowedMethods.enum[methodName] && identity === userTypes.Enum.enduser) {
        return authorizedResponse
    }
    if (methods.enum[methodName] && identity === userTypes.Enum.admin) {
        return authorizedResponse
    }

    return unauthorizedResponse
}