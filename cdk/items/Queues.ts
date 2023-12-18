import { Construct } from 'constructs'
import { Architecture, AssetCode, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Queue } from 'aws-cdk-lib/aws-sqs'

export class QueuesStack extends Construct {
  readonly jobImmDLQ: Queue
  readonly jobDelayDLQ: Queue
  public readonly jobImmQueue: Queue
  public readonly jobDelayQueue: Queue

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.jobImmDLQ = new Queue(this, 'AWSJobImmDLQ', {
      visibilityTimeout: Duration.seconds(62),
    })
    this.jobDelayDLQ = new Queue(this, 'AWSJobDelayDLQ', {
      visibilityTimeout: Duration.seconds(62),
    })

    this.jobImmQueue = new Queue(this, 'AWSJobImmediateQueue', {
      visibilityTimeout: Duration.seconds(62),
      queueName: 'AWSJobImmediateQueue',
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.jobImmDLQ,
      },
    })

    this.jobDelayQueue = new Queue(this, 'AWSJobDelayingQueue', {
      visibilityTimeout: Duration.seconds(62),
      queueName: 'AWSJobDelayingQueue',
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.jobDelayDLQ,
      },
    })
  }
}
