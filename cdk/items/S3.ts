import { Construct } from 'constructs'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { Duration, Stack } from 'aws-cdk-lib';

export const getAwsBucketName = (accountId: string) => `aws-bucket-${accountId}-prod`
export class S3Storage extends Construct {
    public readonly awsBucket: Bucket

    constructor(scope: Construct, id: string) {
        super(scope, id)

        const accountId = Stack.of(this).account

        this.awsBucket = new Bucket(this, 'COSBucket', {
            bucketName: getAwsBucketName(accountId),
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            versioned: true,
        })
        this.awsBucket.addLifecycleRule({
            noncurrentVersionExpiration: Duration.days(1),
            noncurrentVersionsToRetain: 3,
        })
    }
}
