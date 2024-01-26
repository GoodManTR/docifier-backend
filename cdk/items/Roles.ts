import { AttributeType, BillingMode, ProjectionType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export const AWSLambdaRoleName = 'AWSLambdaRole'

export class Roles extends Construct {
    public readonly role: Role

    constructor(scope: Construct, id: string) {
      super(scope, id);

      this.role = new Role(this, id, {
        roleName: AWSLambdaRoleName,
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    })
    if (this.role) {
        this.role.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                resources: ['*'],
                actions: [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'ec2:*',
                    'dynamodb:*',
                    'logs:*',
                    'events:*',
                    'lambda:*',
                    's3:*',
                    'cloudwatch:*',
                    'sns:*',
                    'sts:*',
                    'kinesis:*',
                    'secretsmanager:GetSecretValue',
                    'states:*',
                    'iam:*',
                    'cloudfront:*',
                    'sqs:*'
                ],
            }),
        );
        
        this.role.addToPolicy(
            new PolicyStatement({
                effect: Effect.DENY,
                resources: ['*'],
                actions: [
                    // 'logs:CreateLogGroup',
                    // 'logs:CreateLogStream',
                    // 'logs:PutLogEvents',
                    'iam:CreateServiceLinkedRole',
                ],
            }),
        );
    }
  

    }
  }