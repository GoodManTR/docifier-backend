export const GENERAL_TABLE = 'DatabaseTable'
export const CONCURRENCY_TABLE = 'ConcurrencyTable'

export const getQueueURL = (accountId: string, region: string, queueName: string) => {
      return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
  }

// S3
export const getBucketName = (accountId?: string) => `aws-bucket-${accountId || process.env.AWS_ACCOUNT_ID}-prod`

export const getStateMachineArn = (accountId: string, region: string, stateMachineName: string) => {
  return `arn:aws:states:${region}:${accountId}:stateMachine:${stateMachineName}`
}