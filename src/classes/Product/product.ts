import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { PRODUCTS_TABLE } from '../../helpers/constants'
import { ProductSchema, productSchema, upsertProductInput } from './models'
import { Response } from '../../helpers/response'
import { Context } from '../../models'
import { priceMapper } from '../../helpers/formatter'
import { customAlphabet } from 'nanoid'

const client = new DynamoDBClient({})
const dynamo = DynamoDBDocumentClient.from(client)

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 21)

export const upsertProduct = async (context: Context) => {
    try {
        const _input = upsertProductInput.safeParse(context.body)

        if (_input.success === false) {
            throw new Response({
                statusCode: 400,
                message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',
                addons: { issues: _input.error.issues },
            })
        }
        const { productId, stock } = _input.data

        const product = {
            productId: _input.data.productId || nanoid(),
            name: _input.data.name,
            description: _input.data.description,
            prices: {
                ...priceMapper(_input.data.normalPrice || 0, _input.data.discountedPrice || 0),
                currency: 'TRY',
            },
            attributes: _input.data.attributes,
        } as ProductSchema

        if (!productId) {
            product.analytics = {
                viewCount: 0,
                salesCount: 0,
                favoriteCount: 0,
            }

            product.stock = stock

            const dynamoReq = await dynamo.send(
                new PutCommand({
                    TableName: PRODUCTS_TABLE,
                    Item: product,
                }),
            )

            if (dynamoReq.$metadata.httpStatusCode !== 200) {
                throw new Response({ statusCode: 400, message: 'Database Error, please contact admin !', addons: { error: dynamoReq } })
            }
        }

        if (productId) {
            const dynamoGetReq = await dynamo.send(
                new GetCommand({
                    TableName: PRODUCTS_TABLE,
                    Key: {
                        productId,
                    },
                }),
            )

            if (dynamoGetReq.$metadata.httpStatusCode !== 200) {
                throw new Response({ statusCode: 400, message: 'Database Error, please contact admin !', addons: { error: dynamoGetReq } })
            }
            product.analytics = dynamoGetReq.Item!.analytics
            product.stock = stock || dynamoGetReq.Item!.stock

            const dynamoReq = await dynamo.send(
                new PutCommand({
                    TableName: PRODUCTS_TABLE,
                    Item: product,
                }),
            )

            if (dynamoReq.$metadata.httpStatusCode !== 200) {
                throw new Response({ statusCode: 400, message: 'Database Error, please contact admin !', addons: { error: dynamoReq } })
            }
        }

        return new Response({ statusCode: 200, body: product }).response
    } catch (error) {
        return error instanceof Response
            ? error.response
            : new Response({ statusCode: 400, message: 'Generic Examinator Error', addons: { error: error } }).response
    }
}
