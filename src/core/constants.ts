export const GENERAL_TABLE = 'DatabaseTable'



export const getBucketName = (accountId?: string) => `aws-bucket-${accountId || process.env.AWS_ACCOUNT_ID}-prod`