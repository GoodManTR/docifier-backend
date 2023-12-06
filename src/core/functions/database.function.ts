import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb'
import { GENERAL_TABLE } from '../constants'
import { QueryDatabaseOperation, ReadDatabaseOperation, RemoveFromDatabaseOperation, WriteToDatabaseOperation } from '../models/database.model'
import { isSuccess } from '../helpers'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

function getDatabasePrimaryKey(item: { partKey: string }): string {
  const { partKey } = item
  return ['DB', partKey].join('#')
}

function getDatabaseSecondaryKey(partKey: string, sortKey: string): string {
  return [partKey, sortKey].join('#')
}

function extractSortKeyFromSecondaryKey(secondaryKey: string, partKey: string): string {
  const partKeyPartCount = partKey.split('#').length
  return secondaryKey.split('#').slice(partKeyPartCount).join('#')
}

function getDatabaseSecondaryKeyFromItem(item: { partKey: string, sortKey: string }): string {
      const { partKey, sortKey } = item
      return getDatabaseSecondaryKey(partKey, sortKey)
}

export const readDatabase = async (input: ReadDatabaseOperation) => {
  const dynamoReq = await dynamo.send(
    new GetCommand({
      TableName: GENERAL_TABLE,
      Key: {
        part: getDatabasePrimaryKey(input),
        sort: getDatabaseSecondaryKeyFromItem(input),
      },
    }),
  )

  return dynamoReq
}

export const writeToDatabase = async (input: WriteToDatabaseOperation) => {
  const dynamoReq = await dynamo.send(
    new PutCommand({
      TableName: GENERAL_TABLE,
      Item: {
        part: getDatabasePrimaryKey(input),
        sort: getDatabaseSecondaryKeyFromItem(input),
        data: input.data,
        expiresAt: input.expireAt,
      },
    }),
  )

  return {
      success: isSuccess(dynamoReq.$metadata.httpStatusCode),
  }
}

export const removeFromDatabase = async (input: RemoveFromDatabaseOperation) => {
  const dynamoReq = await dynamo.send(
    new DeleteCommand({
      TableName: GENERAL_TABLE,
      Key: {
        part: getDatabasePrimaryKey(input),
        sort: getDatabaseSecondaryKeyFromItem(input),
      },
    }),
  )

  return dynamoReq
}

export const queryDatabase = async (input: QueryDatabaseOperation) => {
  const part = getDatabasePrimaryKey(input)
  const queryInput: QueryCommandInput = {
    TableName: GENERAL_TABLE,
    KeyConditionExpression: '#part = :part',
    ProjectionExpression: '#data, #sort',
    ExpressionAttributeNames: {
      '#part': 'part',
      '#sort': 'sort',
      '#data': 'data',
    },
    ExpressionAttributeValues: {
      ':part': part,
    },
    ScanIndexForward: input.reverse,
    Limit: input.limit,
  }
  if (input.nextToken) {
    queryInput.ExclusiveStartKey = {
      part,
      sort: input.nextToken,
    }
  }
  if (input.beginsWith) {
    queryInput.ExpressionAttributeValues![':bw'] = getDatabaseSecondaryKey(input.partKey, input.beginsWith)
    queryInput.KeyConditionExpression! += ' AND begins_with(#sort, :bw)'
  } else if (input.greaterOrEqual && input.lessOrEqual) {
    queryInput.ExpressionAttributeValues![':gte'] = getDatabaseSecondaryKey(input.partKey, input.greaterOrEqual)
    queryInput.ExpressionAttributeValues![':lte'] = getDatabaseSecondaryKey(input.partKey, input.lessOrEqual)
    queryInput.KeyConditionExpression! += ' AND #sort BETWEEN :gte AND :lte'
  } else if (input.greaterOrEqual) {
    queryInput.ExpressionAttributeValues![':gte'] = getDatabaseSecondaryKey(input.partKey, input.greaterOrEqual)
    queryInput.KeyConditionExpression! += ' AND #sort >= :gte'
  } else if (input.lessOrEqual) {
    queryInput.ExpressionAttributeValues![':lte'] = getDatabaseSecondaryKey(input.partKey, input.lessOrEqual)
    queryInput.KeyConditionExpression! += ' AND #sort <= :lte'
  }
  return dynamo.send(new QueryCommand(queryInput)).then((r) => {
    return {
      success: true,
      data: {
        items: r.Items?.map((i) => ({
          partKey: input.partKey,
          sortKey: extractSortKeyFromSecondaryKey(i.sort, input.partKey),
          data: i.data,
        })),
        nextToken: r.LastEvaluatedKey?.sort,
      },
    }
  })
}
