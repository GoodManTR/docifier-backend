import { Context, Job } from '../models/data.model'
import { chunk } from 'lodash'
import { SendMessageBatchCommand, SQS } from '@aws-sdk/client-sqs'
import { getQueueURL } from '../constants'
import { ScheduleMessage } from '../models/queue.model'

const sqs = new SQS({})

const { AWS_ACCOUNT_ID, AWS_REGION_ID } = process.env

export async function sendToSchedulerSQS(scheduleMessage: ScheduleMessage[]): Promise<void> {
  if (!scheduleMessage.length) return

  const promises: any[] = []

  const delayMessages: ScheduleMessage[] = []
  const immMessages: ScheduleMessage[] = []
  for (const m of scheduleMessage) {
    if (m.after !== 0 && m.after <= 900) {
      delayMessages.push(m)
    } else {
      immMessages.push(m)
    }
  }

  if (delayMessages.length > 0) {
    for (const batch of chunk(delayMessages, 10)) {
      promises.push(
        sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: getQueueURL(AWS_ACCOUNT_ID!, AWS_REGION_ID!, 'AWSJobDelayingQueue'),
            Entries: batch.map((m, i) => ({
              MessageBody: JSON.stringify(m),
              DelaySeconds: m.after,
              Id: i.toString(),
            })),
          }),
        ),
      )
    }
  }
  if (immMessages.length > 0) {
    for (const batch of chunk(immMessages, 10)) {
      promises.push(
        sqs.send(
          new SendMessageBatchCommand({
            QueueUrl: getQueueURL(AWS_ACCOUNT_ID!, AWS_REGION_ID!, 'AWSJobImmediateQueue'),
            Entries: batch.map((m, i) => ({
              MessageBody: JSON.stringify(m),
              Id: i.toString(),
            })),
          }),
        ),
      )
    }
  }
  await Promise.all(promises)
}

export const handleJobs = async (jobs: Job[], context: Context): Promise<void> => {
  if (!jobs.length) return Promise.resolve()

  const nowInMilliseconds = Date.now()
  const nowInSeconds = Math.floor(nowInMilliseconds / 1000)

  const messages: ScheduleMessage[] = jobs.map((job) => ({
    classId: job.classId,
    instanceId: job.instanceId,
    methodName: job.methodName,
    body: job.body || {},
    after: job.after,
    startAt: nowInSeconds + job.after,
    context: {
      ...context,
      instanceId: job.instanceId,
      methodName: job.methodName,
      classId: job.classId,
    },
  }))

  const blocks = chunk(messages, 10)

  const responses = await Promise.allSettled([...blocks.map((block) => sendToSchedulerSQS(block))])

  for (const response of responses) {
    if (response.status === 'rejected') throw new Error('error while sending to scheduler' + response.reason)
  }
}
