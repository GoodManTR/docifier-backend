export const GENERAL_TABLE = 'DatabaseTable'



export const getBucketName = (accountId?: string) => `cos-bucket-${accountId || process.env.AWS_ACCOUNT_ID}-prod`