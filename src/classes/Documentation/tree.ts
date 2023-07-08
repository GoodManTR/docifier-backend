import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { Context } from '../../models'
import { getDocTreeInput, saveDocTreeInput } from './models'
import { CustomError, Errors, SuccessResponse } from '../../packages/response-manager'
import { DOCUMENTATION_TABLE, DOCUMENTATION_TREE_TABLE } from '../../packages/utils/constants'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const dynamodb = new DynamoDB(client)

export const saveDocumentationTree = async (context: Context) => {
    try {
        const input = saveDocTreeInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }

        const { documentationId, tree } = input.data

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

        if (!(document.Item.users.some((user) => user.userId === context.userId))) {
            throw new CustomError({ error: Errors.Documentation[5001]})
        }

        const dynamoReq = await dynamo.send(
            new PutCommand({
                TableName: DOCUMENTATION_TREE_TABLE,
                Item: {
                    documentationId,
                    tree,
                },
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: dynamoReq } })
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

export const getDocumentationTree = async (context: Context) => {
    try {
        const input = getDocTreeInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }

        const { documentationId } = input.data

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

        if (!(document.Item.users.some((user) => user.userId === context.userId))) {
            throw new CustomError({ error: Errors.Documentation[5001]})
        }

        const docTree = await dynamo.send(
            new GetCommand({
                TableName: DOCUMENTATION_TREE_TABLE,
                Key: {
                    documentationId,
                },
            }),
        )

        if (!docTree || !docTree.Item) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: docTree })
        }

        return new SuccessResponse({
            body: docTree.Item,
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}
