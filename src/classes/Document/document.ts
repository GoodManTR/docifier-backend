import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Context } from '../../models'
import { CustomError, Errors, SuccessResponse } from '../../packages/response-manager'
import { DOCUMENT_TABLE, DOCUMENTATION_TABLE } from '../../packages/utils/constants'
import { getDocSheetInput, saveDocSheetInput } from './models'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export const saveDocument = async (context: Context) => {
  try {
    const input = saveDocSheetInput.safeParse(context.body)

    if (input.success === false) {
      throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
    }

    const { documentationId, documentId, data } = input.data

    const documentation = await dynamo.send(
      new GetCommand({
        TableName: DOCUMENTATION_TABLE,
        Key: {
          documentationId,
        },
      }),
    )

    if (!documentation || !documentation.Item) {
      throw new CustomError({ error: Errors.Documentation[5000], addons: documentationId })
    }

    if (!documentation.Item.users.some((user) => user.userId === context.userId)) {
      throw new CustomError({ error: Errors.Documentation[5001] })
    }

    const document = await dynamo.send(
      new PutCommand({
        TableName: DOCUMENT_TABLE,
        Item: {
          documentationId,
          documentId,
          data,
        },
      }),
    )

    if (document.$metadata.httpStatusCode !== 200) {
      throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: document } })
    }

    return new SuccessResponse({
      body: {
        success: true,
      },
    }).response
  } catch (error) {
    return error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
  }
}

export const getDocument = async (context: Context) => {
  try {
    const input = getDocSheetInput.safeParse(context.body)

    if (input.success === false) {
      throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
    }

    const { documentationId, documentId } = input.data

    const document = await dynamo.send(
      new GetCommand({
        TableName: DOCUMENTATION_TABLE,
        Key: {
          documentationId,
        },
      }),
    )

    if (!document || !document.Item) {
      throw new CustomError({ error: Errors.Documentation[5000], addons: documentationId })
    }

    if (!document.Item.users.some((user) => user.userId === context.userId)) {
      throw new CustomError({ error: Errors.Documentation[5001] })
    }

    const docSheet = await dynamo.send(
      new GetCommand({
        TableName: DOCUMENT_TABLE,
        Key: {
          documentId,
        },
      }),
    )

    if (!docSheet || !docSheet.Item) {
      throw new CustomError({ error: Errors.Documentation[5000], addons: docSheet })
    }

    return new SuccessResponse({
      body: docSheet.Item,
    }).response
  } catch (error) {
    return error instanceof CustomError ? error.friendlyResponse : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
  }
}
