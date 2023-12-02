import { APIGatewayProxyEventV2 } from 'aws-lambda';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import firebaseAdmin from 'firebase-admin';
import serviceAccount from './firebase.json';
import { CustomError, Errors } from './packages/response-manager';
import { createContext } from './core/context';
import { checkInstance, fetchStateFromS3, putState } from './core/repositories/state.repository';

interface Template {
  authorizer: string;
  getState: string;
  init: string;
  get: string | undefined
  methods: {
    method: string;
    handler: string;
    type: 'READ' | 'WRITE'
  }[];
}

export let firebaseApp: firebaseAdmin.app.App;

async function initializeFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount as any),
      databaseURL: "https://docifier-6f1c1-default-rtdb.europe-west1.firebasedatabase.app",
    });
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<any> {
  try {
    await initializeFirebaseApp();

    const params = event.pathParameters?.proxy?.split('/') || [];
    if (params.length < 3) throw new CustomError({ error: Errors.Api[5001] });

    const context = await createContext(event);

    let queryStringParameters = event.queryStringParameters ?? {}
    if (event.queryStringParameters?.['data'] && event.queryStringParameters?.['__isbase64']) {
      const base64Data = event.queryStringParameters['data']
      const jsonString = Buffer.from(base64Data, 'base64').toString('utf8')
      queryStringParameters = JSON.parse(jsonString)
    }

    const data = {
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

    const action = params[0];
    const classId = params[1];
    const reqMethod = params[2];
    const instanceId: string | undefined = action === 'CALL' ? params[3] : params[2]

    const templateFilePath = `classes/${classId}/template.yml`;
    const fileContents = await fs.readFile(templateFilePath, 'utf8');
    const templateContent = yaml.load(fileContents) as Template;

    if (action === 'CALL') {
      const instanceExists = await checkInstance(classId, instanceId)
      if (!instanceExists) {
        throw new Error('Instance does not exist')
      }

      if (!templateContent.getState) {
        throw new Error('template.yml does not have getState delegate')
      }

      // Authorizer
      const [authorizerFile, authorizerMethod] = templateContent.authorizer.split('.')
      const authorizerModulePath = path.join(__dirname, 'classes', classId, `${authorizerFile}.js`)
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
      const modulePath = path.join(__dirname, 'classes', classId, `${handlerFile}.js`)
      const requiredModule = require(modulePath)

      const methodHandler = requiredModule[methodName]
      const responseData = await methodHandler(data)

      await putState(classId, instanceId, responseData.state)

      return responseData.response
    } else if (action === 'INSTANCE') {
      if (instanceId) {
        const instanceExists = await checkInstance(classId, instanceId)
        if (!instanceExists) {
          throw new Error('Instance does not exist')
        }

        if (!templateContent.getState) {
          throw new Error('template.yml does not have getState delegate')
        }
      }

      // Authorizer
      const [authorizerFile, authorizerMethod] = templateContent.authorizer.split('.')
      const authorizerModulePath = path.join(__dirname, 'classes', classId, `${authorizerFile}.js`)
      const authorizerRequiredModule = require(authorizerModulePath)
      const authorizerHandler = authorizerRequiredModule[authorizerMethod]

      const authorizerResponse = await authorizerHandler(data)
      if (authorizerResponse.statusCode !== 200) {
        return authorizerResponse
      }

      if (instanceId && templateContent.get) {
        // get
        const [getMethodFile, getMethod] = templateContent.get.split('.')
        const getMethodModulePath = path.join(__dirname, 'classes', classId, `${getMethodFile}.js`)
        const getMethodRequiredModule = require(getMethodModulePath)
        const getHandler = getMethodRequiredModule[getMethod]

        const responseData = await getHandler(data)

        await putState(classId, instanceId, responseData.state)

        return responseData.response
      } else if (instanceId && !templateContent.get) {
        return {
          statusCode: 200,
          body: JSON.stringify({ })
        }
      } else if (!instanceId) {
        if (!templateContent.init) {
          throw new Error('Init method is not defined in template.yml')
        }

        // init
        const [initMethodFile, initMethod] = templateContent.init.split('.')
        const initMethodModulePath = path.join(__dirname, 'classes', classId, `${initMethodFile}.js`)
        const initMethodRequiredModule = require(initMethodModulePath)
        const initHandler = initMethodRequiredModule[initMethod]
      
        const responseData = await initHandler(data)

        await putState(classId, instanceId, responseData.state)

        return responseData.response
      }
    }
  } catch (error) {
    if (error instanceof CustomError) {
      return error.friendlyResponse;
    } else {
      const errorMessage = (error as Error).message;
      return new CustomError('System', 1000, 500, { issues: errorMessage }).friendlyResponse;
    }
  }
}
