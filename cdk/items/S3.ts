import { Construct } from 'constructs'
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3'
import { Duration, Stack } from 'aws-cdk-lib';

export const getImageBucketName = (accountId: string) => `image-bucket-${accountId}-prod`
export const getAwsBucketName = (accountId: string) => `aws-bucket-${accountId}-prod`
export class S3Storage extends Construct {
    public readonly imageBucket: Bucket
    public readonly awsBucket: Bucket

    constructor(scope: Construct, id: string) {
        super(scope, id)

        const accountId = Stack.of(this).account

        this.imageBucket = new Bucket(this, 'image-bucket', {
            bucketName: getImageBucketName(accountId),
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
        })

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
