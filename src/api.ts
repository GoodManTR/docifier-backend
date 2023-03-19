import { APIGatewayProxyEventV2 } from 'aws-lambda'
import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { CustomError, Errors, SuccessResponse } from './helpers'
import { createContext } from './helpers/context'
interface Template {
    authorizer: string
    methods: [
        {
            method: string
            handler: string
        },
    ]
}

export async function handler(event: APIGatewayProxyEventV2): Promise<any> {
    try {
        const params = event.pathParameters?.proxy?.split('/') || []
        if (params.length < 2) throw new CustomError({ error: Errors.Api[5001] })
        const context = createContext(event)

        const classId = params[0]
        const reqMethod = params[1]

        const templateFile = `classes/${classId}/template.yml`

        const fileContents = fs.readFileSync(templateFile, 'utf8')
        const templateContent = (await yaml.load(fileContents)) as Template

        // Authorizer
        const authorizerFile = templateContent.authorizer.split('.')[0]
        const authorizerMethod = templateContent.authorizer.split('.')[1]

        const authorizerModulePath = path.join(__dirname, 'classes', classId, `${authorizerFile}.js`);
        const authorizerRequiredModule = require(authorizerModulePath)

        const authorizerHandler = authorizerRequiredModule[authorizerMethod]

        const authorizerResponse = await authorizerHandler(context)
        
        if (authorizerResponse.statusCode !== 200) {
            return authorizerResponse
        }

        // Method
        const method = templateContent.methods.find((m) => m.method === reqMethod)
        if (!method) {
            throw new CustomError({ error: Errors.Api[5002] })
        }

        const handlerFile = method!.handler.split('.')[0]
        const methodName = method!.handler.split('.')[1]

        const modulePath = path.join(__dirname, 'classes', classId, `${handlerFile}.js`);
        const requiredModule = require(modulePath)
        
        // Get the function dynamically using the `handler` property
        const methodHandler = requiredModule[methodName]
        return await methodHandler(context)
    } catch (error) {
        return error instanceof CustomError
            ? error.friendlyResponse
            : new CustomError('System', 1000, 500, { issues: (error as Error).message }).friendlyResponse
    }
}