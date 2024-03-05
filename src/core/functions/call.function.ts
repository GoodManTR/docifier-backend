import crypto from 'node:crypto'
import { MethodCallInput, MethodCallOutput, runFunctionEnum } from '../models/call.model'
import { runFunction } from 'core/helpers'
import { CustomError } from 'response-manager'

function generateHash(payload: object | string): string {
  return crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')
}

export const methodCall = async (input: MethodCallInput): Promise<MethodCallOutput> => {
  try {
    const { classId, methodName, instanceId, body, context } = input

    let data = {
      state: {},
      request: body || {},
      response: {},
      context: {
        ...context,
        classId,
        instanceId,
        methodName,
        identity: 'CLASS',
      },
      jobs: [],
    } as any
  
    const responseData = await runFunction({
      classId,
      instanceId,
      methodName,
      data,
      type: runFunctionEnum.Enum.method,
    })
  
    return {
      statusCode: responseData.response.statusCode,
      headers: responseData.response.headers,
      body: JSON.parse(responseData.response.body),
    }
  } catch (error) {
    return error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).response
  }
}
