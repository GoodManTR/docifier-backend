import { checkInstance, fetchStateFromS3, putState } from '../archives/state.archive'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { DeleteReferenceKeyInput, DeleteReferenceKeyOutput, GetInstanceInput, GetInstanceOutput, GetReferenceKeyInput, GetReferenceKeyOutput, SetReferenceKeyInput, SetReferenceKeyOutput } from '../models/instance.model'
import { Data, Template } from '../models/data.model'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { BatchGetCommand, DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { GENERAL_TABLE } from '../constants'
import { isSuccess } from '../helpers'
import { handleTasks } from '../archives/task.archive'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export function getReferencePrimaryKey(lookUp: GetReferenceKeyInput): string {
  return ['RK', lookUp.classId, lookUp.key.name, lookUp.key.value].join('#')
}

export const getInstance = async (input: GetInstanceInput): Promise<GetInstanceOutput> => {
  const { classId, body, referenceKey, queryStringParams } = input
  let instanceId = input.instanceId

  let res: GetInstanceOutput = {
    statusCode: 200,
    body: {},
    headers: undefined,
    info: undefined,
  }
  
  if (!instanceId && referenceKey) {
    const get = await getReferenceKey({
      classId,
      key: referenceKey,
    })

    if (!get.instanceId) {
      throw new Error(`Instance with reference key ${referenceKey.name}=${referenceKey.value} does not exist in class ${classId}`)
    }

    instanceId === get.instanceId
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
      identity: 'CLASS'
    } as any,
    tasks: [],
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

    await handleTasks(responseData.tasks, responseData.context)

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

  await handleTasks(responseData.tasks, responseData.context)

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

export const getReferenceKey = async (input: GetReferenceKeyInput): Promise<GetReferenceKeyOutput> => {
  let response = {
    success: true,
    instanceId: '',
  }

  try {
    const dynamoReq = await dynamo.send(
      new GetCommand({
        TableName: GENERAL_TABLE,
        Key: {
          part: getReferencePrimaryKey(input),
          sort: 'RK',
        },
      }),
    )

    if (!isSuccess(dynamoReq.$metadata.httpStatusCode) || !dynamoReq.Item) {
      response.success = false
    }

    response.instanceId = dynamoReq.Item?.instanceId || ''
  } catch (error) {
    response.success = false
  }

  return response
}

export const setReferenceKey = async (input: SetReferenceKeyInput): Promise<SetReferenceKeyOutput> => {
  let response = {
    success: true
  }

  try {
    const dynamoReq = await dynamo.send(
      new PutCommand({
        TableName: GENERAL_TABLE,
        Item: {
          part: getReferencePrimaryKey(input),
          sort: 'RK',
          instanceId: input.instanceId,
        },
      }),
    )

    if (!isSuccess(dynamoReq.$metadata.httpStatusCode)) {
      response.success = false
    }
  } catch (error) {
    response.success = false
  }

  return response
}

export const deleteReferenceKey = async (input: DeleteReferenceKeyInput): Promise<DeleteReferenceKeyOutput> => {
  let response = {
    success: true
  }
  
  try {
    const dynamoReq = await dynamo.send(
      new DeleteCommand({
        TableName: GENERAL_TABLE,
        Key: {
          part: getReferencePrimaryKey(input),
          sort: 'RK',
        },
      }),
    )

    if (!isSuccess(dynamoReq.$metadata.httpStatusCode)) {
      response.success = false
    }
  } catch (error) {
    response.success = false
  }

  return response
}