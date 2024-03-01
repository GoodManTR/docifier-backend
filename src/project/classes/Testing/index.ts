
import { authorizerCacheTime } from "utils/cache-ages";
import { CustomError, SuccessResponse } from "response-manager";
import { Data, deleteFile, deleteInstance, generateCustomToken, getFile, getInstance, methodCall, setFile, writeToDatabase } from "core";

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
    try {
        data.state.private.asd = 1

        const customToken = await generateCustomToken({
            userId: 'asdasd',
            identity: 'asdasd',
            claims: {}
        })

        const res = await methodCall({
            classId: 'Testing',
            methodName: 'customMethod3',
            body: {}
        })
        
        data.jobs.push({
            classId: 'Testing',
            methodName: 'customMethod3',
            after: 20,
            body: {}
        })

        data.jobs.push({
            classId: 'Testing',
            instanceId: 'default',
            methodName: 'customMethod2',
            after: 0,
            body: {}
        })
    
        data.response = new SuccessResponse({
            body: {
                customToken,
                res,
                data,
            }
        }).response
    } catch (error) {
        data.response = error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
    return data
}

export const customMethod2 = async (data: Data) => {

    data.state.private.asd = 3
    data.response = new SuccessResponse({
        body: data.state.private
    }).response
    return data
}

export const customMethod3 = async (data: Data) => {
    data.response = new SuccessResponse({
        body: {
            static: true
        }
    }).response
    return data
}

export async function getInstanceId(): Promise<string> {
    return 'default'
}