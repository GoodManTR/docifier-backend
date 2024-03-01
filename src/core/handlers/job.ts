import { SQSEvent } from 'aws-lambda'
import { Data } from '../models/data.model'
import { ScheduleMessage } from '../models/queue.model'
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn'
import { getStateMachineArn } from '../constants'
import { runFunctionEnum } from 'core/models/call.model'
import { runFunction } from 'core/helpers'

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
          await runFunction({
            classId,
            instanceId,
            data,
            type: runFunctionEnum.Enum.instance
          })
        } else {
          await runFunction({
            classId,
            methodName: reqMethod,
            instanceId,
            data,
            type: runFunctionEnum.Enum.method
          })
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


