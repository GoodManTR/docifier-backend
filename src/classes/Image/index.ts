import { authorizerCacheTime } from "../../packages/utils/cache-ages";
import { Context } from "../../models";
import { allowedMethods, methods } from "./types";
import { userTypes } from "../../types";
import { SuccessResponse } from "../../packages/response-manager";

const unauthorizedResponse = new SuccessResponse({
    statusCode: 403,
    body: {message: 'ACCESS_DENIED'},
}).response

const authorizedResponse = new SuccessResponse({
    statusCode: 200,
    headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${authorizerCacheTime}`,
    },
}).response

export const authorizer = async (context: Context) => {
    const  { methodName, identity } = context

    if (allowedMethods.enum[methodName]) return authorizedResponse
    if (methods.enum[methodName] && identity === userTypes.Enum.admin) {
        return authorizedResponse
    }
    
    return unauthorizedResponse
}