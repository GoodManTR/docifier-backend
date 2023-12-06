
import { CustomError, Errors, SuccessResponse } from "../../packages/response-manager";
import { Data } from "../../../core";
import { ClassData } from "./types";
import { CreateUserInput, createUserInput } from "./models";
import { v4 as uuidv4 } from 'uuid'

const unauthorizedResponse = new SuccessResponse({
    statusCode: 403,
    body: { message: 'ACCESS_DENIED' },
}).response

const authorizedResponse = new SuccessResponse({}).response

export const authorizer = async (data: Data) => {
    const  { methodName, identity } = data.context
    
    return authorizedResponse
}

export const init = async (data: ClassData<CreateUserInput>) => {
    try {
        const input = createUserInput.safeParse(data.request.body)
        if (!input.success) {
          throw new CustomError({ error: Errors.Authenticator[5001] })
        }
    
        data.state.private = input.data

    
        data.response = new SuccessResponse({}).response
    } catch (error) {
        data.response = error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
    return data
}

export async function getInstanceId(data: ClassData): Promise<string> {
    return uuidv4()
}