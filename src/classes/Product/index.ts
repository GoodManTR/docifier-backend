import { Response } from '../../helpers/response'
import { authorizerCacheTime } from "../../helpers/cache-ages";
import { Context } from "../../models";
import { allowedMethods, methods } from './types';
import { userTypes } from '../../types';

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
    const  { methodName, identity } = context

    if (allowedMethods.enum[methodName]) return authorizedResponse
    if (methods.enum[methodName] && identity === userTypes.Enum.admin) {
        return authorizedResponse
    }
    
    return unauthorizedResponse
}