import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { Context } from '../../models'
import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { PROFILE_TABLE } from '../../helpers/constants'
import { UserData } from './types'
import { upsertProfileInput } from './models'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export const getProfile = async (context: Context): Promise<any> => {
    try {
        const { userId } = context

        if (!userId || userId === 'none') {
            throw new CustomError({ error: Errors.User[5001] })
        }

        const dynamoReq = await dynamo.send(
            new GetCommand({
                TableName: PROFILE_TABLE,
                Key: {
                    userId,
                },
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200 || !dynamoReq.Item) {
            throw new CustomError({ error: Errors.User[5000], addons: { userId } })
        }

        return new SuccessResponse({
            body: dynamoReq.Item,
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}

export const upsertProfile = async (context: Context): Promise<any> => {
    try {
        const { userId } = context

        if (!userId) {
            throw new CustomError({ error: Errors.User[5001] })
        }

        const input = upsertProfileInput.safeParse(context.body)

        if (!input.success) {
            throw new CustomError({ error: Errors.User[5000], addons: { userId, issues: input.error } })
        }

        const dynamoReq = await dynamo.send(
            new GetCommand({
                TableName: PROFILE_TABLE,
                Key: {
                    userId,
                },
            }),
        )

        if (dynamoReq.$metadata.httpStatusCode !== 200) {
            throw new CustomError({ error: Errors.User[5000], addons: { userId } })
        }

        const userData = dynamoReq.Item

        if (!userData) {
            const dynamoReq = await dynamo.send(
                new PutCommand({
                    TableName: PROFILE_TABLE,
                    Item: {...input.data, userId},
                }),
            )

            if (dynamoReq.$metadata.httpStatusCode !== 200) {
                throw new CustomError({ error: Errors.User[5000], addons: { userId } })
            }
        }

        if (userData) {
            const newProfileItem  = {
                ...userData,
                ...input.data,
            }

            const dynamoReq = await dynamo.send(
                new PutCommand({
                    TableName: PROFILE_TABLE,
                    Item: newProfileItem,
                }),
            )

            if (dynamoReq.$metadata.httpStatusCode !== 200) {
                throw new CustomError({ error: Errors.User[5000], addons: { userId } })
            }
        }

        return new SuccessResponse({
            body: {
                success: true,
            }
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}