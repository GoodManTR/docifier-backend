import { checkInstance, deleteInstanceFromS3, fetchStateFromS3, putState } from '../archives/state.archive'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { DeleteInstanceInput, DeleteReferenceKeyInput, DeleteReferenceKeyOutput, GetInstanceInput, GetInstanceOutput, GetReferenceKeyInput, GetReferenceKeyOutput, SetReferenceKeyInput, SetReferenceKeyOutput } from '../models/instance.model'
import { Data, Template } from '../models/data.model'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { BatchGetCommand, DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { GENERAL_TABLE } from '../constants'
import { isSuccess, runFunction } from '../helpers'
import { handleJobs } from '../archives/job.archive'
import { chunk } from 'lodash'
import { deleteFromReferenceKeyTable, getReferenceKeys } from 'core/archives/reference.archive'
import { runFunctionEnum } from 'core/models/call.model'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export function getReferencePrimaryKey(lookUp: GetReferenceKeyInput): string {
  return ['RK', lookUp.classId, lookUp.key.name, lookUp.key.value].join('#')
}

export const getInstance = async (input: GetInstanceInput): Promise<GetInstanceOutput> => {
  const { classId, body, referenceKey, queryStringParams, context } = input
  let instanceId = input.instanceId

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
      ...context,
      classId,
      instanceId,
      methodName: 'GET',
      identity: 'CLASS'
    } as any,
    jobs: [],
  }

  const responseData = await runFunction({
    classId,
    instanceId,
    data,
    type: runFunctionEnum.Enum.instance,
  })

  const responseBody = JSON.parse(responseData.body)
  
  return {
    ...responseData.response,
    body: responseBody.response,
    info: {
      isNewInstance: responseBody.isNewInstance,
      instanceId: responseBody.instanceId
    }
  }
}

// TODO:
export async function deleteInstance(input: DeleteInstanceInput): Promise<void> {
  const lookUpKeys = await Promise.allSettled(await getReferenceKeys(input)).then((results) =>
    results
      .map((result) => {
        if (result.status === 'fulfilled') return result.value
        else return []
      })
      .reduce((final: any[], items: any[]) => {
        if (Array.isArray(items) && items.length) final.push(...items)
        return final
      }, []),
  )
  for (const items of chunk(lookUpKeys, 25)) await deleteFromReferenceKeyTable(items)
  await deleteInstanceFromS3(input)
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