import { SearchInput, SearchOutput, AggregateOutput, searchInput, ProductSearchSchema } from './models'
import { buildSearch, buildAggs } from './search-builder'
import { Context } from '../../models'
import { Response } from '../../helpers/response'
import { DynamoDB, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PRODUCTS_TABLE } from '../../helpers/constants'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const client = new DynamoDBClient({})
const dynamodb = new DynamoDB(client);

export const search = async (context: Context) => {
  try {
    const input = searchInput.safeParse(context.queryStringParameters)

    if (input.success === false) {
      throw new Response({
          statusCode: 400,
          message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',
          addons: { issues: input.error.issues },
      })
    }
  
    const params = {
      TableName: PRODUCTS_TABLE,
    };
  
    const dynamoReq = await dynamodb.scan(params)
  
    const items = dynamoReq.Items?.map((item) => unmarshall(item))
  
    const response = buildSearch(items as any, input.data.query)
    
    return new Response({ 
      statusCode: 200,
      body: {
        data: response.data as ProductSearchSchema[] || [],
        itemCount: response.itemCount,
        from: response.from,
        size: response.size,
      },
    }).response
  } catch (error) {
    return error instanceof Response
    ? error.response
    : new Response({ statusCode: 400, message: 'Generic Examinator Error', addons: { error: error } }).response
  }

}

export const aggregate = async (context: Context) => {
  try {
    const input = searchInput.safeParse(context.queryStringParameters)

    if (input.success === false) {
      throw new Response({
          statusCode: 400,
          message: 'Woops! It looks like you sent us the wrong data. Double-check your request and try again.',
          addons: { issues: input.error.issues },
      })
    }
  
    const params = {
      TableName: PRODUCTS_TABLE,
    };
  
    const dynamoReq = await dynamodb.scan(params)
  
    const items = dynamoReq.Items?.map((item) => unmarshall(item))
  
    const aggregations = buildAggs(items as any, input.data.query)
    
    return new Response({ 
      statusCode: 200,
      body: {
        data: aggregations || [],
      },
    }).response
  } catch (error) {
    return error instanceof Response
    ? error.response
    : new Response({ statusCode: 400, message: 'Generic Examinator Error', addons: { error: error } }).response
  }

}
