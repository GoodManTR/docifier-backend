import { Template } from '../models/data.model'
import crypto from 'node:crypto'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { MethodCallInput, MethodCallOutput } from '../models/call.model'
import { checkInstance, fetchStateFromS3, putState } from '../repositories/state.repository'

function generateHash(payload: object | string): string {
  return crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex')
}

export const methodCall = async (input: MethodCallInput): Promise<MethodCallOutput> => {
  const { classId, methodName: reqMethod, instanceId, body } = input

  const instanceExists = await checkInstance(classId, instanceId)
  if (!instanceExists) {
    throw new Error(`Instance with id ${instanceId} does not exist in class ${classId}`)
  }
  
  const state = await fetchStateFromS3(classId, instanceId)
  const stateHash = generateHash(state)

  let data = {
    state,
    request: body || {},
    response: {},
    context: {
      classId,
      instanceId,
      methodName: reqMethod,
    },
  }

  const templateFilePath = `project/classes/${classId}/template.yml`
  const fileContents = await fs.readFile(templateFilePath, 'utf8')
  const templateContent = yaml.load(fileContents) as Template

  // Method
  const method = templateContent.methods.find((m) => m.method === reqMethod)
  if (!method) {
    throw new Error(`Method ${reqMethod} does not exist in class ${classId}`)
  }

  const [handlerFile, methodName] = method.handler.split('.')
  const requiredModule = require(`../../project/classes/${classId}/${handlerFile}.js`)

  const methodHandler = requiredModule[methodName]
  const responseData = await methodHandler(data)

  const isStateModified = stateHash !== generateHash(responseData.state)
  if (method.type === 'WRITE' && isStateModified) {
    await putState(classId, instanceId, responseData.state)
  }

  return {
    statusCode: responseData.response.statusCode,
    headers: responseData.response.headers,
    body: JSON.parse(responseData.response.body),
  }
}
