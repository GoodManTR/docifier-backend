import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { authorizerCacheTime } from "../../helpers/cache-ages";
import { Context } from "../../models";
import { methods } from './types';
import { userTypes } from '../../types';

const unauthorizedResponse = new SuccessResponse({
    statusCode: 403,
    body: { message: 'ACCESS_DENIED' },
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
    
    return authorizedResponse
}