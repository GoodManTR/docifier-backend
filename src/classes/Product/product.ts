import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { PRODUCTS_TABLE } from '../../helpers/constants'
import { tokenMetaData } from '../Auth/types'
import { upsertProductInput } from './models'
import { Response } from '../../helpers/response'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

export const upsertProduct = async (event: APIGatewayProxyEventV2) => {
    const _input = upsertProductInput.safeParse(JSON.parse(event.body || '{}'))

    if (_input.success === false) {
        throw new Response({
            statusCode: 400,
            message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',
            addons: { issues: _input.error.issues },
        })
    }

    const dynamoReq = await dynamo.send(
        new PutCommand({
            TableName: PRODUCTS_TABLE,
            Item: _input.data,
        }),
    )

    if (dynamoReq.$metadata.httpStatusCode !== 200) {
        throw new Response({ statusCode: 400, message: 'Database Error, please contact admin !', addons: { error: dynamoReq } })
    }
    
    return new Response({ statusCode: 200, body: "Succesfully upserted product." }).response
}
