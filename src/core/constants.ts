export const GENERAL_TABLE = 'DatabaseTable'

// SQS
export const AWSJobDelayQueueName = 'AWSJobDelayQueue'
export const AWSJobInstantQueueName = 'AWSJobInstantQueue'

export const getQueueURL = (accountId: string, region: string, queueName: string) => {
      return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
  }

// S3
export const getBucketName = (accountId?: string) => `aws-bucket-${accountId || process.env.AWS_ACCOUNT_ID}-prod`

