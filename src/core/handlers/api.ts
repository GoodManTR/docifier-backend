import { APIGatewayProxyEventV2 } from 'aws-lambda'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import firebaseAdmin from 'firebase-admin'
import { createContext } from '../context'
import { checkInstance, fetchStateFromS3, putState } from '../archives/state.archive'
import { Context, Data, Template } from '../models/data.model'
import { CustomError } from '../packages/error-response'
import { handleJobs } from '../archives/job.archive'
import { authAPI } from 'core/models/auth.model'
import { authWithCustomToken, refreshToken, signOut } from 'core/archives/auth.archive'

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
          const { response: responeseBody, tokenData } = await authWithCustomToken(JSON.parse(event.body || '{}').customToken)
          const response = { statusCode: 200, body: JSON.stringify(responeseBody) }
          return response
        }
        case authAPI.Values.refresh: {
          const { response: responeseBody, tokenData } = await refreshToken(JSON.parse(event.body || '{}').refreshToken)
          const response = { statusCode: 200, body: JSON.stringify(responeseBody) }
          return response
        }
        case authAPI.Values.signOut: {
          const requestBody = JSON.parse(event.body || '{}')
          const { identity, userId, isAnonymous, accessToken } = requestBody
          if (isAnonymous || !userId) {
            throw new Error('Anonymous users cannot sign out')
          }
          await signOut(identity, userId, accessToken)

          return {
            statusCode: 200,
            body: JSON.stringify({}),
          }
        }
        default: {
          throw new Error(`TOKEN handler recived unknown endpoint: ${authEndpoint}`)
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

    const templateFilePath = `project/classes/${classId}/template.yml`
    const fileContents = await fs.readFile(templateFilePath, 'utf8')
    const templateContent = yaml.load(fileContents) as Template

    if (action === 'CALL') {
      const instanceExists = await checkInstance(classId, instanceId)
      if (!instanceExists) {
        throw new Error(`Instance with id ${instanceId} does not exist in class ${classId}`)
      }
    }

    // Authorizer
    const [authorizerFile, authorizerMethod] = templateContent.authorizer.split('.')
    const authorizerRequiredModule = require(`../../project/classes/${classId}/${authorizerFile}.js`)
    const authorizerHandler = authorizerRequiredModule[authorizerMethod]

    const authorizerResponse = await authorizerHandler(data)
    if (authorizerResponse.statusCode !== 200) {
      return authorizerResponse
    }

    if (action === 'CALL') {
      data.state = await fetchStateFromS3(classId, instanceId)

      // Method
      const method = templateContent.methods.find((m) => m.method === reqMethod)
      if (!method) {
        throw new Error(`Method "${reqMethod}" is not defined in template.yml`)
      }

      const [handlerFile, methodName] = method.handler.split('.')
      const requiredModule = require(`../../project/classes/${classId}/${handlerFile}.js`)
      const methodHandler = requiredModule[methodName]

      const responseData: Data = await methodHandler(data)

      if (method.type === 'WRITE') {
        await putState(classId, instanceId, responseData.state)
      }

      await handleJobs(responseData.jobs, responseData.context)

      return responseData.response
    }

    if (action === 'INSTANCE') {
      // getInstanceId
      const [instanceIdMethodFile, instanceIdMethod] = templateContent.getInstanceId.split('.')
      const instanceIdMethodRequiredModule = require(`../../project/classes/${classId}/${instanceIdMethodFile}.js`)
      const instanceIdHandler = instanceIdMethodRequiredModule[instanceIdMethod]

      const responseInstanceId = await instanceIdHandler(data)

      const lastInstanceId = instanceId ?? responseInstanceId
      data.context.instanceId = lastInstanceId

      const instanceExists = await checkInstance(classId, lastInstanceId)

      // get
      if (instanceExists) {
        if (!templateContent.get) {
          return {
            statusCode: 200,
            body: JSON.stringify({}),
          }
        }

        // get
        data.context.methodName = 'GET'
        data.state = await fetchStateFromS3(classId, lastInstanceId)

        const [getMethodFile, getMethod] = templateContent.get.split('.')
        const getMethodRequiredModule = require(`../../project/classes/${classId}/${getMethodFile}.js`)
        const getHandler = getMethodRequiredModule[getMethod]

        const responseData = await getHandler(data)

        await putState(classId, lastInstanceId, responseData.state)

        return responseData.response
      }

      if (instanceId) {
        throw new Error(`Instance with id ${lastInstanceId} does not exist in class ${classId}`)
      }

      if (!templateContent.init) {
        throw new Error('Init method is not defined in template.yml')
      }

      // init
      data.context.methodName = 'INIT'

      const [initMethodFile, initMethod] = templateContent.init.split('.')
      const initMethodRequiredModule = require(`../../project/classes/${classId}/${initMethodFile}.js`)
      const initHandler = initMethodRequiredModule[initMethod]

      const responseData = await initHandler(data)

      await putState(classId, lastInstanceId, responseData.state)

      return responseData.response
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
