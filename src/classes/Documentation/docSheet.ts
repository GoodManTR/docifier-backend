import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { DOC_SHEET_TABLE, DOC_TABLE } from '../../helpers/constants'
import { Context } from '../../models'
import { getDocSheetInput, saveDocSheetInput } from './models'
import { CustomError, Errors, SuccessResponse } from '../../helpers/response-manager'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const dynamodb = new DynamoDB(client)

export const saveDocumentationSheet = async (context: Context) => {
    try {
        const input = saveDocSheetInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }

        const { docId, sheetId, data } = input.data

        const document = await dynamo.send(
            new GetCommand({
                TableName: DOC_TABLE,
                Key: {
                    docId,
                },
            }),
        )

        if (!document || !document.Item) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: docId })
        }

        if (!(document.Item.users.some((user) => user.userId === context.userId))) {
            throw new CustomError({ error: Errors.Documentation[5001]})
        }

        const docSheet = await dynamo.send(
            new PutCommand({
                TableName: DOC_SHEET_TABLE,
                Item: {
                    docId,
                    sheetId,
                    data
                },
            }),
        )

        if (docSheet.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: docSheet } })
        }

        return new SuccessResponse({
            body: {
                success: true
            },
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}

export const getDocumentationSheet = async (context: Context) => {
    try {
        const input = getDocSheetInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }

        const { docId, sheetId } = input.data

        const document = await dynamo.send(
            new GetCommand({
                TableName: DOC_TABLE,
                Key: {
                    docId,
                },
            }),
        )

        if (!document || !document.Item) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: docId })
        }

        if (!(document.Item.users.some((user) => user.userId === context.userId))) {
            throw new CustomError({ error: Errors.Documentation[5001]})
        }

        const docSheet = await dynamo.send(
            new GetCommand({
                TableName: DOC_SHEET_TABLE,
                Key: {
                    sheetId
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
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}