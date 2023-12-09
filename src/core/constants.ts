export const GENERAL_TABLE = 'DatabaseTable'

// SQS
export const AWSJobDelayQueueName = 'AWSJobDelayQueue'
export const AWSJobInstantQueueName = 'AWSJobInstantQueue'

// S3
export const getBucketName = (accountId?: string) => `aws-bucket-${accountId || process.env.AWS_ACCOUNT_ID}-prod`