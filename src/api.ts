import { APIGatewayProxyEventV2 } from 'aws-lambda'
import * as path from 'path'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import firebaseAdmin from 'firebase-admin'

import { CustomError, Errors } from './project/packages/response-manager'
import { createContext } from './core/context'
import { checkInstance, fetchStateFromS3, putState } from './core/repositories/state.repository'
import { Context } from './core/models/data.model'

interface Template {
  authorizer: string
  getState: string
  init: string
  get: string | undefined
  getInstanceId: string
  methods: {
    method: string
    handler: string
    type: 'READ' | 'WRITE'
  }[]
}

const prepareData = (event: APIGatewayProxyEventV2, context: Context) => {
  let queryStringParameters = event.queryStringParameters ?? {}
  if (event.queryStringParameters?.['data'] && event.queryStringParameters?.['__isbase64']) {
    const base64Data = event.queryStringParameters['data']
    const jsonString = Buffer.from(base64Data, 'base64').toString('utf8')
    queryStringParameters = JSON.parse(jsonString)
  }

  return {
    context,
    state: {
      private: {},
      public: {},
    },
    request: {
      headers: event.headers,
      body: event.body ? JSON.parse(event.body) : {},
      queryStringParameters,
      pathParameters: event.pathParameters,
      httpMethod: event.requestContext.http.method,
    },
    response: {},
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<any> {
  try {
    const params = event.pathParameters?.proxy?.split('/') || []
    const paramCount = params[0] === 'CALL' ? 3 : 2
    if (params.length < paramCount) throw new CustomError({ error: Errors.Api[5001] })

    const context = await createContext(event)
    const data = prepareData(event, context)

    const action = params[0]
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

      // Authorizer
      const [authorizerFile, authorizerMethod] = templateContent.authorizer.split('.')
      const authorizerModulePath = path.join(__dirname, 'project', 'classes', classId, `${authorizerFile}.js`)
      const authorizerRequiredModule = require(authorizerModulePath)
      const authorizerHandler = authorizerRequiredModule[authorizerMethod]

      const authorizerResponse = await authorizerHandler(data)
      if (authorizerResponse.statusCode !== 200) {
        return authorizerResponse
      }

      data.state = await fetchStateFromS3(classId, instanceId)

      // Method
      const method = templateContent.methods.find((m) => m.method === reqMethod)
      if (!method) {
        throw new CustomError({ error: Errors.Api[5002] })
      }

      const [handlerFile, methodName] = method.handler.split('.')
      const modulePath = path.join(__dirname, 'project', 'classes', classId, `${handlerFile}.js`)
      const requiredModule = require(modulePath)

      const methodHandler = requiredModule[methodName]
      const responseData = await methodHandler(data)

      if (method.type === 'WRITE') {
        await putState(classId, instanceId, responseData.state)
      }

      return responseData.response
    }
    if (action === 'INSTANCE') {
      // Authorizer
      const [authorizerFile, authorizerMethod] = templateContent.authorizer.split('.')
      const authorizerModulePath = path.join(__dirname, 'project', 'classes', classId, `${authorizerFile}.js`)
      const authorizerRequiredModule = require(authorizerModulePath)
      const authorizerHandler = authorizerRequiredModule[authorizerMethod]

      const authorizerResponse = await authorizerHandler(data)
      if (authorizerResponse.statusCode !== 200) {
        return authorizerResponse
      }

      // getInstanceId
      const [instanceIdMethodFile, instanceIdMethod] = templateContent.getInstanceId.split('.')
      const instanceIdMethodModulePath = path.join(__dirname, 'project', 'classes', classId, `${instanceIdMethodFile}.js`)
      const instanceIdMethodRequiredModule = require(instanceIdMethodModulePath)
      const instanceIdHandler = instanceIdMethodRequiredModule[instanceIdMethod]

      const responseInstanceId = await instanceIdHandler(data)
      data.context.instanceId = instanceId ?? responseInstanceId

      const instanceExists = await checkInstance(classId, instanceId ?? responseInstanceId)

      if (instanceExists) {
        if (!templateContent.get) {
          return {
            statusCode: 200,
            body: JSON.stringify({}),
          }
        }

        // get
        data.context.methodName = 'GET'

        const [getMethodFile, getMethod] = templateContent.get.split('.')
        const getMethodModulePath = path.join(__dirname, 'project', 'classes', classId, `${getMethodFile}.js`)
        const getMethodRequiredModule = require(getMethodModulePath)
        const getHandler = getMethodRequiredModule[getMethod]

        const responseData = await getHandler(data)

        await putState(classId, instanceId, responseData.state)

        return responseData.response
      }

      if (instanceId) {
        throw new Error(`Instance with id ${instanceId} does not exist in class ${classId}`)
      }

      if (!templateContent.init) {
        throw new Error('Init method is not defined in template.yml')
      }

      // init
      data.context.methodName = 'INIT'

      const [initMethodFile, initMethod] = templateContent.init.split('.')
      const initMethodModulePath = path.join(__dirname, 'project', 'classes', classId, `${initMethodFile}.js`)
      const initMethodRequiredModule = require(initMethodModulePath)
      const initHandler = initMethodRequiredModule[initMethod]

      const responseData = await initHandler(data)

      await putState(classId, responseInstanceId, responseData.state)

      return responseData.response
    }
  } catch (error) {
    if (error instanceof CustomError) {
      return error.friendlyResponse
    } else {
      const errorMessage = (error as Error).message
      return new CustomError('System', 1000, 500, { issues: errorMessage }).friendlyResponse
    }
  }
}
