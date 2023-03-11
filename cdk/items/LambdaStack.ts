import { Construct } from 'constructs'
import { Architecture, AssetCode, Function, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { Duration } from 'aws-cdk-lib'
import { Effect, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'

export class LambdaStack extends Construct {
    public readonly apiHandlerLambda: Function

    constructor(scope: Construct, id: string, role: Role, layer: LayerVersion, codeAsset: AssetCode, accountId: string) {
      super(scope, id)

      this.apiHandlerLambda = new Function(this, 'apiHandlerLambda', {
        runtime: Runtime.NODEJS_16_X,
        code: codeAsset,
        handler: 'api.handler',
        architecture: Architecture.ARM_64,
        timeout: Duration.seconds(45),
        role,
        layers: [layer],
        environment: {
          ACCESS_TOKEN_SECRET: 'ACCESS_TOKEN_SECRET',
          REFRESH_TOKEN_SECRET: 'REFRESH_TOKEN_SECRET',
        },
      })

    }
  }