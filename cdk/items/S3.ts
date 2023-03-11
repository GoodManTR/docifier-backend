import { Construct } from 'constructs'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { Stack } from 'aws-cdk-lib';

export const getBucketName = (accountId: string) => `image-bucket-${accountId}-prod`

export class S3Storage extends Construct {
    public readonly imageBucket: Bucket

    constructor(scope: Construct, id: string) {
        super(scope, id)

        const accountId = Stack.of(this).account

        this.imageBucket = new Bucket(this, 'image-bucket', {
            bucketName: getBucketName(accountId),
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        })
    }
}
