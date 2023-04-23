import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { DOC_TABLE } from '../../helpers/constants'
import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { Context } from '../../models'
import { customAlphabet } from 'nanoid'
import { DocumentationConfig, documentationConfig } from './models'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)
const dynamodb = new DynamoDB(client)

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export const createDocumentation = async (context: Context) => {
    try {
        const input = documentationConfig.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }
        const { alias, users } = input.data

        const dynamoReq = await dynamo.send(
            new PutCommand({
                TableName: DOC_TABLE,
                Item: {
                    projectId: nanoid(),
                    alias,
                    users,
                },
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: dynamoReq } })
        }

        return new SuccessResponse({}).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}

export const getDocumentations = async (context: Context) => {
    try {
        const dynamoReq = await dynamodb.scan({
            TableName: DOC_TABLE,
        })

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: dynamoReq } })
        }

        const unmarshalledProjects = dynamoReq.Items?.map((item) => unmarshall(item)) as  DocumentationConfig[]
        const userProjects = unmarshalledProjects.filter((project) => {
            if (!project.users) {
                return false
            }
            return project.users.some((user) => user.userId === context.userId);
        });

        return new SuccessResponse({
            body: userProjects,
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}


export const deleteDocumentation = async (context: Context) => {
    try {
        const input = documentationConfig.safeParse(context.body)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: input.error.issues } })
        }
        const { docId } = input.data

        const dynamoReq = await dynamo.send(
            new DeleteCommand({
                TableName: DOC_TABLE,
                Key: {
                    docId,
                }
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.Documentation[5000], addons: { issues: dynamoReq } })
        }

        return new SuccessResponse({}).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}