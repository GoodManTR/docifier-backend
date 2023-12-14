import { Construct } from 'constructs'
import { Architecture, AssetCode, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'

export class LambdaStack extends Construct {
    public readonly apiHandlerLambda: Function
    public readonly optionsHandlerLambda: Function
    public readonly taskHandlerLambda: Function

    constructor(scope: Construct, id: string, role: Role, layer: LayerVersion, codeAsset: AssetCode, accountId: string, region: string) {
      super(scope, id)

      this.apiHandlerLambda = new Function(this, 'apiHandlerLambda', {
        runtime: Runtime.NODEJS_16_X,
        code: codeAsset,
        handler: 'core/handlers/api.handler',
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(45),
        memorySize: 1769,
        role,
        layers: [layer],
        environment: {
          AWS_ACCOUNT_ID: accountId,
          AWS_REGION_ID: region,
        },
      })

      this.optionsHandlerLambda = new Function(this, 'optionsHandlerLambda', {
        runtime: Runtime.NODEJS_16_X,
        code: codeAsset,
        handler: 'core/handlers/options.handler',
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(45),
        memorySize: 128,
        role,
        layers: [layer],
        environment: {
          AWS_ACCOUNT_ID: accountId,
          AWS_REGION_ID: region,
        },
      })

      this.taskHandlerLambda = new Function(this, 'taskHandlerLambda', {
        runtime: Runtime.NODEJS_16_X,
        code: codeAsset,
        handler: 'core/handlers/task.handler',
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(60),
        memorySize: 1769,
        role,
        layers: [layer],
        environment: {
          AWS_ACCOUNT_ID: accountId,
          AWS_REGION_ID: region,
        },
      })

    }
  }