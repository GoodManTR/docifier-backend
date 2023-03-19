import { SearchInput, SearchOutput, AggregateOutput, searchInput, ProductSearchSchema } from './models'
import { buildSearch, buildAggs } from './search-builder'
import { Context } from '../../models'
import { CustomError, Errors, SuccessResponse } from '../../helpers'
import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PRODUCTS_TABLE } from '../../helpers/constants'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})
const dynamodb = new DynamoDB(client)

export const search = async (context: Context) => {
    try {
        const input = searchInput.safeParse(context.queryStringParameters)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Product[5000], addons: { issues: input.error.issues } })
        }

        const params = {
            TableName: PRODUCTS_TABLE,
        }

        const dynamoReq = await dynamodb.scan(params)

        const items = dynamoReq.Items?.map((item) => unmarshall(item))

        const response = buildSearch(items as any, input.data.query)

        return new SuccessResponse({
            body: {
                data: (response.data as ProductSearchSchema[]) || [],
                itemCount: response.itemCount,
                from: response.from,
                size: response.size,
            },
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}

export const aggregate = async (context: Context) => {
    try {
        const input = searchInput.safeParse(context.queryStringParameters)

        if (input.success === false) {
            throw new CustomError({ error: Errors.Product[5000], addons: { issues: input.error.issues } })
        }

        const params = {
            TableName: PRODUCTS_TABLE,
        }

        const dynamoReq = await dynamodb.scan(params)

        const items = dynamoReq.Items?.map((item) => unmarshall(item))

        const aggregations = buildAggs(items as any, input.data.query)

        return new SuccessResponse({
            body: {
                data: aggregations || [],
            },
        }).response
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}
