
import { authorizerCacheTime } from "../../packages/utils/cache-ages";
import { SuccessResponse } from "../../packages/response-manager";
import { Data, deleteFile, generateCustomToken, getFile, getInstance, methodCall, setFile, writeToDatabase } from "../../../core";

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

    data.response = new SuccessResponse({
        body: {
            qwe: 'asdasdasdasd'
        }
    }).response
    return data
}

export const get = async (data: Data) => {
    data.state.private.asd = 1

    data.response = new SuccessResponse({
        body: {
            qwe: 'get'
        }
    }).response
    return data
}

export const customMethod = async (data: Data) => {
    data.state.private.asd = 1

    data.jobs.push({
        classId: 'Testing',
        methodName: 'customMethod2',
        instanceId: 'default',
        after: 20,
        body: {}
    })

    data.response = new SuccessResponse({
        body: data.state.private
    }).response
    return data
}

export const customMethod2 = async (data: Data) => {

    data.state.private.asd = 3
    data.response = new SuccessResponse({
        body: data.state.private
    }).response
    return data
}

export async function getInstanceId(): Promise<string> {
    return 'default'
}