import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DOC_TABLE } from '../../helpers/constants'
import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { Context } from '../../models'
import { customAlphabet } from 'nanoid'
import { DocumentationConfig, addUserInput, documentationConfig } from './models'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const dynamodb = new DynamoDB(client)

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export const addUser = async (context: Context) => {
    try {
        const input = addUserInput.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }
        const { userId, docId} = input.data

        const getProject = await dynamo.send(
            new GetCommand({
                TableName: DOC_TABLE,
                Key: {
                    docId,
                },
            }),
        )

        if (getProject.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: getProject } })
        }

        const documentation = getProject.Item as DocumentationConfig
        documentation.users!.push({ userId, role: 'user' })

        const updateProject = await dynamo.send(
            new PutCommand({
                TableName: DOC_TABLE,
                Item: documentation,
            }),
        )

        if (updateProject.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: updateProject } })
        }
        return new SuccessResponse({}).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}