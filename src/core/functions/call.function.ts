import { Template } from '../models/data.model'
import crypto from 'node:crypto'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { MethodCallInput, MethodCallOutput, runFunctionEnum } from '../models/call.model'
import { checkInstance, fetchStateFromS3, putState } from '../archives/state.archive'
import { handleJobs } from '../archives/job.archive'
import { runFunction } from 'core/helpers'

function generateHash(payload: object | string): string {
  return crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')
}

export const methodCall = async (input: MethodCallInput): Promise<MethodCallOutput> => {
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
}
