import { APIGatewayProxyEventV2 } from 'aws-lambda';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import firebaseAdmin from 'firebase-admin';
import serviceAccount from './firebase.json';
import { CustomError, Errors } from './packages/response-manager';
import { createContext } from './packages/utils/context';

interface Template {
  authorizer: string;
  methods: {
    method: string;
    handler: string;
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
    if (params.length < 2) throw new CustomError({ error: Errors.Api[5001] });

    const context = await createContext(event);

    const classId = params[0];
    const reqMethod = params[1];

    const templateFile = `classes/${classId}/template.yml`;

    const fileContents = await fs.readFile(templateFile, 'utf8');
    const templateContent = yaml.load(fileContents) as Template;

    // Authorizer
    const [authorizerFile, authorizerMethod] = templateContent.authorizer.split('.');
    const authorizerModulePath = path.join(__dirname, 'classes', classId, `${authorizerFile}.js`);
    const authorizerRequiredModule = require(authorizerModulePath);
    const authorizerHandler = authorizerRequiredModule[authorizerMethod];

    const authorizerResponse = await authorizerHandler(context);
    if (authorizerResponse.statusCode !== 200) {
      return authorizerResponse;
    }

    // Method
    const method = templateContent.methods.find((m) => m.method === reqMethod);
    if (!method) {
      throw new CustomError({ error: Errors.Api[5002] });
    }

    const [handlerFile, methodName] = method.handler.split('.');
    const modulePath = path.join(__dirname, 'classes', classId, `${handlerFile}.js`);
    const requiredModule = require(modulePath);

    const methodHandler = requiredModule[methodName];
    return await methodHandler(context);
  } catch (error) {
    if (error instanceof CustomError) {
      return error.friendlyResponse;
    } else {
      const errorMessage = (error as Error).message;
      return new CustomError('System', 1000, 500, { issues: errorMessage }).friendlyResponse;
    }
  }
}
