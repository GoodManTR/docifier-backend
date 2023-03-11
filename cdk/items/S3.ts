import { Construct } from 'constructs'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { Stack } from 'aws-cdk-lib';

export const getBucketName = (accountId: string) => `cos-bucket-${accountId}-prod`

export class S3Storage extends Construct {
    public readonly bucket: Bucket

    constructor(scope: Construct, id: string) {
        super(scope, id)

        const accountId = Stack.of(this).account

        this.bucket = new Bucket(this, id, {
            bucketName: getBucketName(accountId),
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        })
    }
}
