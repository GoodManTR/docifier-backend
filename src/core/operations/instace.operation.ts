import { checkInstance, fetchStateFromS3, putState } from '../repositories/state.repository'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { GetInstanceInput, GetInstanceOutput } from '../models/instance.model'
import { Data, Template } from '../models/data.model'
import { MethodCallOutput } from '../models/call.model'

export const getInstance = async (input: GetInstanceInput): Promise<GetInstanceOutput> => {
  const { classId, instanceId, body, queryStringParams } = input

  let res: GetInstanceOutput = {
    statusCode: 200,
    body: {},
    headers: undefined,
    info: undefined,
  }

  let data: Data = {
    state: {
      private: {},
      public: {},
    },
    request: {
      headers: {},
      body: body || {},
      queryStringParams,
      pathParameters: {},
      httpMethod: 'GET',
    },
    response: {} as any,
    context: {
      classId,
      instanceId,
      methodName: 'GET',
    } as any,
  }

  const templateFilePath = `project/classes/${classId}/template.yml`
  const fileContents = await fs.readFile(templateFilePath, 'utf8')
  const templateContent = yaml.load(fileContents) as Template

  // getInstanceId
  const [instanceIdMethodFile, instanceIdMethod] = templateContent.getInstanceId.split('.')
  const instanceIdMethodRequiredModule = require(`../../project/classes/${classId}/${instanceIdMethodFile}.js`)

  const instanceIdHandler = instanceIdMethodRequiredModule[instanceIdMethod]
  const responseInstanceId = await instanceIdHandler(data)

  const lastInstanceId = instanceId ?? responseInstanceId

  data.context.instanceId = lastInstanceId

  const instanceExists = await checkInstance(classId, lastInstanceId)

  // get
  if (instanceExists) {
    if (!templateContent.get) {
      return {
        statusCode: 200,
        body: {},
        info: {
          isNewInstance: false,
          instanceId: lastInstanceId
        }
      }
    }

    data.state = await fetchStateFromS3(classId, lastInstanceId)

    const [getMethodFile, getMethod] = templateContent.get.split('.')
    const getMethodRequiredModule = require(`../../project/classes/${classId}/${getMethodFile}.js`)
    const getHandler = getMethodRequiredModule[getMethod]

    const responseData = await getHandler(data)

    await putState(classId, lastInstanceId, responseData.state)

    res = {
      statusCode: responseData.response.statusCode,
      headers: responseData.response.headers,
      body: JSON.parse(responseData.response.body),
      info: {
        isNewInstance: false,
        instanceId: lastInstanceId
      }
    }

    return res
  }

  if (instanceId) {
    res = {
      statusCode: 404,
      body: `Instance with id ${instanceId} does not exist in class ${classId}`,
      headers: undefined,
    }
    return res
  }

  if (!templateContent.init) {
    res = {
      statusCode: 500,
      body: `Init method is not defined in template.yml`,
      headers: undefined,
    }
    return res
  }

  // init
  data.context.methodName = 'INIT'

  const [initMethodFile, initMethod] = templateContent.init.split('.')
  const initMethodRequiredModule = require(`../../project/classes/${classId}/${initMethodFile}.js`)
  const initHandler = initMethodRequiredModule[initMethod]

  const responseData = await initHandler(data)

  await putState(classId, responseInstanceId, responseData.state)

  res = {
    statusCode: responseData.response.statusCode,
    headers: responseData.response.headers,
    body: JSON.parse(responseData.response.body),
    info: {
      isNewInstance: true,
      instanceId: lastInstanceId
    }
  }

  return res
}
