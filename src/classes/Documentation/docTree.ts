import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { DOC_TREE_TABLE, DOC_TABLE } from '../../helpers/constants'
import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { Context } from '../../models'
import { saveDocTreeInput } from './models'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const dynamodb = new DynamoDB(client)

export const saveDocumentationTree = async (context: Context) => {
    try {
        const input = saveDocTreeInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }

        const { docId, tree } = input.data

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

        const dynamoReq = await dynamo.send(
            new PutCommand({
                TableName: DOC_TREE_TABLE,
                Item: {
                    docId,
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
