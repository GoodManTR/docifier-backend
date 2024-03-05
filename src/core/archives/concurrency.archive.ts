import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { CONCURRENCY_TABLE } from '../constants'
import { LockInstanceInput } from 'core/models/concurrency.model'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export const isConcurrencyLocked = async (input: LockInstanceInput) => {
  try {
    const dynamoReq = await dynamo.send(
      new GetCommand({
        TableName: CONCURRENCY_TABLE,
        Key: {
          part: `${input.classId}_${input.instanceId}`,
        },
      }),
    )

    // Check if lock entry exists
    return dynamoReq.Item !== undefined
  } catch (error) {
    console.error('Error checking concurrency lock:', error)
    return false // Return false in case of error
  }
}

export const lockConcurrency = async (input: LockInstanceInput) => {
  const currentTime = Math.floor(Date.now() / 1000) // Convert milliseconds to seconds
  const expiresAt = currentTime + 40

  await dynamo.send(
    new PutCommand({
      TableName: CONCURRENCY_TABLE,
      Item: {
        part: `${input.classId}_${input.instanceId}`,
        expiresAt: expiresAt,
      },
    }),
  )
}

export const unlockConcurrency = async (input: LockInstanceInput) => {
  await dynamo.send(
    new DeleteCommand({
      TableName: CONCURRENCY_TABLE,
      Key: {
        part: `${input.classId}_${input.instanceId}`,
      },
    }),
  )
}
