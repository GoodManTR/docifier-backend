import { SQSEvent } from 'aws-lambda'
import * as fs from 'fs/promises'
import * as yaml from 'js-yaml'
import { checkInstance, fetchStateFromS3, putState } from '../archives/state.archive'
import { Data, Template } from '../models/data.model'
import { handleJobs } from '../archives/job.archive'
import { ScheduleMessage } from '../models/queue.model'
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn'
import { getStateMachineArn } from '../constants'

const sfn = new SFNClient({ })

const oneYear = 365 * 24 * 3600

const { AWS_ACCOUNT_ID, AWS_REGION_ID } = process.env

export async function handler(event: SQSEvent): Promise<any> {
  const response: any = { batchItemFailures: [] }
  const nowInSeconds = Math.floor(Date.now() / 1000)

  for (const record of event.Records) {
    try {
      const { classId, methodName: reqMethod, instanceId, body, context, after, startAt }: ScheduleMessage = JSON.parse(record.body)
      if (after <= 900) {
        const templateFilePath = `project/classes/${classId}/template.yml`
        const fileContents = await fs.readFile(templateFilePath, 'utf8')
        const templateContent = yaml.load(fileContents) as Template

        const data = {
          context,
          state: {
            public: {},
            private: {},
          },
          request: {
            httpMethod: 'POST',
            body: body,
            headers: context.headers,
            queryStringParams: {},
            pathParameters: {},
          },
          response: {
            statusCode: 200,
            body: {},
          },
          jobs: [],
        } as Data

        if (reqMethod === 'INIT' || reqMethod === 'GET') {
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
        } else {
          if (!instanceId) {
            return
          }
          const instanceExists = await checkInstance(classId, instanceId)
          if (!instanceExists) {
            throw new Error(`Instance with id ${instanceId} does not exist in class ${classId}`)
          }

          data.state = await fetchStateFromS3(classId, instanceId)

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
        }
      } else {
        const timeDiff = startAt - nowInSeconds

        const sfStartAt = timeDiff >= oneYear ? oneYear - 3600 : startAt
        await sfn.send(
          new StartExecutionCommand({
            stateMachineArn: getStateMachineArn(AWS_ACCOUNT_ID!, AWS_REGION_ID!, 'LongJobMachine'),
            name: context.requestId,
            input: JSON.stringify({ ...JSON.parse(record.body), startAt: new Date(sfStartAt * 1000).toISOString() }),
          }),
        )
      }
    } catch (error) {
      response.batchItemFailures.push({ itemIdentifier: record.receiptHandle })
    }
  }
}


