import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { createContext } from '../context'
import { Context, Data } from '../models/data.model'
import { CustomError } from '../packages/error-response'
import { authAPI } from 'core/models/auth.model'
import { authWithCustomToken, refreshToken, signOut } from 'core/archives/auth.archive'
import { runFunction } from 'core/helpers'
import { runFunctionEnum } from 'core/models/call.model'

const prepareData = (event: APIGatewayProxyEventV2, context: Context): Data => {
  let queryStringParams = event.queryStringParameters ?? {}
  if (event.queryStringParameters?.['data'] && event.queryStringParameters?.['__isbase64']) {
    const base64Data = event.queryStringParameters['data']
    const jsonString = Buffer.from(base64Data, 'base64').toString('utf8')
    queryStringParams = JSON.parse(jsonString)
  }

  return {
    context,
    state: {
      private: {},
      public: {},
    },
    request: {
      headers: event.headers as any,
      body: event.body ? JSON.parse(event.body) : {},
      queryStringParams,
      pathParameters: event.pathParameters,
      httpMethod: event.requestContext.http.method,
    },
    response: {} as any,
    jobs: [],
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<any> {
  try {
    const params = event.pathParameters?.proxy?.split('/') || []

    const action = params[0]
    if (action === 'AUTH') {
      const authEndpoint = params[1]
      switch (authEndpoint) {
        case authAPI.Values.auth: {
          const { response: responeseBody } = await authWithCustomToken(JSON.parse(event.body || '{}').customToken)
          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Expose-Headers': '*',
              'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
              'Access-Control-Allow-Headers': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(responeseBody),
          }
          return response
        }
        case authAPI.Values.refresh: {
          const { response: responeseBody } = await refreshToken(JSON.parse(event.body || '{}').refreshToken)
          const response = {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Expose-Headers': '*',
              'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
              'Access-Control-Allow-Headers': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(responeseBody),
          }
          return response
        }
        case authAPI.Values.signOut: {
          const accessToken = (event.headers['Core-Authorization'] || event.headers['core-authorization'] || '').substring(7)

          await signOut(accessToken)

          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Expose-Headers': '*',
              'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
              'Access-Control-Allow-Headers': '*',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }
        }
        default: {
          throw new Error(`AUTH handler recived unknown endpoint: ${authEndpoint}`)
        }
      }
    }

    // CALL OR INSTANCE
    const paramCount = action === 'CALL' ? 3 : 2
    if (params.length < paramCount) throw new Error('Router http handler recived invalid path parameters')

    const context = await createContext(event)
    const data = prepareData(event, context)

    const classId = params[1]
    const reqMethod: string | undefined = params[2]
    const instanceId: string | undefined = action === 'CALL' ? params[3] : params[2]

    // Authorizer
    const authorizerResponse = await runFunction({
      classId,
      instanceId,
      data,
      type: runFunctionEnum.Enum.authorizer,
    })
    if (authorizerResponse.statusCode !== 200) {
      return authorizerResponse
    }

    if (action === 'CALL') {
      const responseData: Data = await runFunction({
        classId,
        instanceId,
        methodName: reqMethod,
        data,
        type: runFunctionEnum.Enum.method,
      })

      return responseData.response
    }

    if (action === 'INSTANCE') {
      const responseData: Data = await runFunction({
        classId,
        instanceId,
        data,
        type: runFunctionEnum.Enum.instance,
      })

      return responseData
    }
  } catch (error) {
    if (error instanceof CustomError) {
      return error.friendlyResponse
    } else {
      const errorMessage = (error as Error).message
      return new CustomError('System', 1000, 500, { issues: error }).friendlyResponse
    }
  }
}
