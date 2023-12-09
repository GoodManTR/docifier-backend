import { Construct } from 'constructs'
import { Architecture, AssetCode, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Queue } from 'aws-cdk-lib/aws-sqs'

export class QueuesStack extends Construct {
  readonly taskImmDLQ: Queue
  readonly taskDelayDLQ: Queue
  public readonly taskImmQueue: Queue
  public readonly taskDelayQueue: Queue

  constructor(scope: Construct, id: string) {
    super(scope, id)

    this.taskImmDLQ = new Queue(this, 'AWSTaskImmDLQ', {
      visibilityTimeout: Duration.seconds(62),
    })
    this.taskDelayDLQ = new Queue(this, 'AWSTaskDelayDLQ', {
      visibilityTimeout: Duration.seconds(62),
    })

    this.taskImmQueue = new Queue(this, 'AWSTaskImmediateQueue', {
      visibilityTimeout: Duration.seconds(62),
      queueName: 'AWSTaskImmediateQueue',
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.taskImmDLQ,
      },
    })

    this.taskDelayQueue = new Queue(this, 'AWSTaskDelayingQueue', {
      visibilityTimeout: Duration.seconds(62),
      queueName: 'AWSTaskDelayingQueue',
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: this.taskDelayDLQ,
      },
    })
  }
}
