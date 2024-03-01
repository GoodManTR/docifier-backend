import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { Data, Template } from './models/data.model'
import { RunFunctionEnum, runFunctionEnum } from './models/call.model'
import { checkInstance, fetchStateFromS3, putState } from './archives/state.archive'
import { handleJobs } from './archives/job.archive'

export const isSuccess = (statusCode = 0): boolean => statusCode >= 200 && statusCode < 300

interface RunFunctionParams {
  classId: string
  instanceId?: string
  methodName?: string
  data: Data
  type: RunFunctionEnum
}

export const runFunction = async ({ classId, instanceId, methodName, data, type }: RunFunctionParams) => {
  const templateFilePath = `project/classes/${classId}/template.yml`
  const fileContents = await fs.readFile(templateFilePath, 'utf8')
  const templateContent = yaml.load(fileContents) as Template

  if (type === runFunctionEnum.Enum.method) {
    const templateMethod = templateContent.methods.find((m) => m.method === methodName)
    if (!templateMethod) {
      throw new Error(`Method "${methodName}" is not defined in template.yml`)
    }

    const isMethodStatic = templateMethod.type === 'STATIC'

    if (!isMethodStatic && !instanceId) {
      throw new Error(`Instance id is required for method "${methodName}" in class ${classId}`)
    }

    if (!isMethodStatic) {
      const instanceExists = await checkInstance(classId, instanceId)
      if (!instanceExists) {
        throw new Error(`Instance with id ${instanceId} does not exist in class ${classId}`)
      }
    }

    data.state = !isMethodStatic ? await fetchStateFromS3(classId, instanceId!) : { private: {}, public: {} }

    const [handlerFile, handlerMethodName] = templateMethod.handler.split('.')
    const requiredModule = require(`../project/classes/${classId}/${handlerFile}.js`)
    const methodHandler = requiredModule[handlerMethodName]

    const responseData: Data = await methodHandler(data)

    if (templateMethod.type === 'WRITE') {
      await putState(classId, instanceId!, responseData.state)
    }

    await handleJobs(responseData.jobs, responseData.context)

    return responseData
  } else if (type === runFunctionEnum.Enum.instance) {
    const instanceExists = await checkInstance(classId, instanceId)

    if (instanceExists) {
      if (!templateContent.get) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            instanceId,
            methods: templateContent.methods.map((m) => ({
              method: m.method,
              type: m.type,
            })),
            isNewInstance: false,
          }),
        }
      }

      data.context.methodName = 'GET'
      data.state = await fetchStateFromS3(classId, instanceId!)

      const [getMethodFile, getMethod] = templateContent.get.split('.')
      const getMethodRequiredModule = require(`../project/classes/${classId}/${getMethodFile}.js`)
      const getHandler = getMethodRequiredModule[getMethod]

      const responseData = await getHandler(data)

      await putState(classId, instanceId!, responseData.state)
      await handleJobs(responseData.jobs, responseData.context)

      return {
        statusCode: responseData.response.statusCode,
        headers: responseData.response.headers,
        body: JSON.stringify({
          response: JSON.parse(responseData.response.body),
          instanceId: responseData.context.instanceId,
          methods: templateContent.methods.map((m) => ({
            method: m.method,
            type: m.type,
          })),
          isNewInstance: false,
        }),
      }
    }

    if (instanceId) {
      throw new Error(`Instance with id ${instanceId} does not exist in class ${classId}`)
    }

    if (!templateContent.init) {
      throw new Error('Init method is not defined in template.yml')
    }

    data.context.methodName = 'INIT'

    const [initMethodFile, initMethod] = templateContent.init.split('.')
    const initMethodRequiredModule = require(`../project/classes/${classId}/${initMethodFile}.js`)
    const initHandler = initMethodRequiredModule[initMethod]

    const responseData = await initHandler(data)

    await putState(classId, instanceId!, responseData.state)
    await handleJobs(responseData.jobs, responseData.context)
    
    return {
      statusCode: responseData.response.statusCode,
      headers: responseData.response.headers,
      body: JSON.stringify({
        response: JSON.parse(responseData.response.body),
        instanceId: responseData.context.instanceId,
        methods: templateContent.methods.map((m) => ({
          method: m.method,
          type: m.type,
        })),
        isNewInstance: true,
      }),
    }
  } else {
    const [file, method] = templateContent[type].split('.')
    const module = require(`../project/classes/${classId}/${file}.js`)
    const handler = module[method]

    return await handler(data)
  }
}
