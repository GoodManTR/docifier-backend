
import { CustomError, Errors, SuccessResponse } from "../../packages/response-manager";
import { Data, generateCustomToken, getInstance, getReferenceKey } from "../../../core";
import { ClassData } from "./types";
import { RegisterInput, registerInput } from "./models";
import { generateHash } from "../../packages/utils/helpers";
import { classIdentities, userIdentities } from "../../packages/utils/commonSchemas/common";
import { isSuccess } from "../../packages/utils/project";

const unauthorizedResponse = new SuccessResponse({
    statusCode: 403,
    body: { message: 'ACCESS_DENIED' },
}).response

const authorizedResponse = new SuccessResponse({}).response

export const authorizer = async (data: Data) => {
    const  { methodName, identity } = data.context

    if (identity === userIdentities.Enum.enduser) {
        return unauthorizedResponse
    }
    
    return authorizedResponse
}

export const init = async (data: ClassData<RegisterInput>) => {
    try {
        const input = registerInput.safeParse(data.request.body)
        if (!input.success) {
          throw new CustomError({ error: Errors.Authenticator[5001] })
        }
    
        const { email, password, confirmPassword } = input.data
        
        const isUserExists = await getReferenceKey({
            classId: classIdentities.Enum.User,
            key: {
                name: 'email',
                value: email,
            },
        })

        if (isUserExists.success) {
            throw new CustomError({ error: Errors.Authenticator[5006] })
        }
    
        if (password !== confirmPassword) {
            throw new CustomError({ error: Errors.Authenticator[5002] })
        }

        const passwordHash = generateHash(password)
    
        data.state.private.email = email
        data.state.private.passwordHash = passwordHash
    
        const userInstance = await getInstance({
            classId: classIdentities.Enum.User,
            body: {
                email: email,
                passwordHash,
            }
        })
    
        if (!isSuccess(userInstance.statusCode) || !userInstance.info?.instanceId) {
            throw new CustomError({ error: Errors.Authenticator[5003], addons: { issues: userInstance.body } })
        }

        data.state.private.userId = userInstance.info.instanceId
    
        const token = await generateCustomToken({
            identity: userIdentities.Enum.enduser,
            userId: userInstance.info.instanceId,
            claims: {
                email,
            }
        })
    
        data.response = new SuccessResponse({
            body: {
                token,
                instance: userInstance.info.instanceId,
            }
        }).response
    } catch (error) {
        data.response = error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
    return data
}

export const get = async (data: ClassData<RegisterInput>) => {
    try {
        const input = registerInput.safeParse(data.request.body)
        if (!input.success) {
          throw new CustomError({ error: Errors.Authenticator[5001] })
        }
    
        const { email, password, confirmPassword } = input.data
        
        const isUserExists = await getReferenceKey({
            classId: classIdentities.Enum.User,
            key: {
                name: 'email',
                value: email,
            },
        })

        if (isUserExists.success) {
            throw new CustomError({ error: Errors.Authenticator[5006] })
        }
    
        if (password !== confirmPassword) {
            throw new CustomError({ error: Errors.Authenticator[5002] })
        }

        const passwordHash = generateHash(password)
    
        data.state.private.email = email
        data.state.private.passwordHash = passwordHash
    
        const userInstance = await getInstance({
            classId: classIdentities.Enum.User,
            body: {
                email: email,
                passwordHash,
            }
        })
    
        if (!isSuccess(userInstance.statusCode) || !userInstance.info?.instanceId) {
            throw new CustomError({ error: Errors.Authenticator[5003], addons: { issues: userInstance.body } })
        }

        data.state.private.userId = userInstance.info.instanceId
    
        const token = await generateCustomToken({
            identity: userIdentities.Enum.enduser,
            userId: userInstance.info.instanceId,
            claims: {
                email,
            }
        })
    
        data.response = new SuccessResponse({
            body: {
                token,
                instance: userInstance.info.instanceId,
            }
        }).response
    } catch (error) {
        data.response = error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
    return data
}

export async function getInstanceId(data: ClassData<RegisterInput>): Promise<string> {
    const input = registerInput.safeParse(data.request.body)
    if (!input.success) {
      throw new CustomError({ error: Errors.Authenticator[5001] })
    }
    return input.data.email
}