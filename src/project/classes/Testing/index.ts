
import { authorizerCacheTime } from "../../packages/utils/cache-ages";
import { userTypes } from '../../types';
import { SuccessResponse } from "../../packages/response-manager";
import { Data } from "../../../core/models/data.model";

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

export const authorizer = async (data: Data) => {
    const  { methodName, identity } = data.context
    
    return authorizedResponse
}

export const init = async (data: Data) => {
    data.state.private.asd = 1

    data.response = new SuccessResponse({}).response
    return data
}

export const customMethod = async (data: Data) => {
    data.state.private.asd = 2

    data.response = new SuccessResponse({
        body: data
    }).response
    return data
}

export async function getInstanceId(): Promise<string> {
    return 'default'
  }