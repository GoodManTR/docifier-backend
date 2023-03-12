import { APIGatewayProxyEventV2 } from 'aws-lambda'
import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import { Response } from './helpers/response'

interface Method {
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
        if (params.length < 2) throw new Error('Router http handler recived invalid path parameters')

        const classId = params[0]
        const reqMethod = params[1]

        const templateFile = `classes/${classId}/template.yml`

        const fileContents = fs.readFileSync(templateFile, 'utf8')
        const methodTemplate = (await yaml.load(fileContents)) as Method

        const method = methodTemplate.methods.find((m) => m.method === reqMethod)
        if (!method) {
            throw new Error('404 - Couldnt find method!')
        }

        const handlerFile = method.handler.split('.')[0]
        const methodName = method.handler.split('.')[1]

        const modulePath = path.join(__dirname, 'classes', classId, `${handlerFile}.js`);
        const requiredModule = require(modulePath)
        
        // Get the function dynamically using the `handler` property
        const handler = requiredModule[methodName]
        return await handler(event)
    } catch (error) {
        return error instanceof Response ? error.response : new Response({ statusCode: 400, message: 'Generic Error', addons: { error: error } }).response
    }
}