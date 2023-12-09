import { Construct } from 'constructs'
import { AssetHashType, Aws, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { Roles } from './items/Roles'
import { S3Storage } from './items/S3'
import { ServiceLayer } from './items/ServiceLayer'
import { LambdaStack } from './items/LambdaStack'
import { AssetCode, Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { App } from 'aws-cdk-lib'
import * as crypto from 'crypto'
import { DistributionStack } from './items/Distribution'
import { CorsHttpMethod, DomainName, HttpApi, HttpMethod, HttpRoute, HttpRouteKey, PayloadFormatVersion } from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { OriginProtocolPolicy, OriginSslPolicy } from 'aws-cdk-lib/aws-cloudfront'
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs'
import { DynamoTable } from './items/DynamoTable'
import { QueuesStack } from './items/Queues'
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources'

interface AWSServiceStackProps extends StackProps {
  codeHash: string
}

export class DocifierStack extends Stack {
  constructor(scope: Construct, id: string, props: AWSServiceStackProps) {
    super(scope, id, props)

    const accountId = Stack.of(this).account

    const apiDomain = process.env.AWS_DOMAIN!

    const codeAsset = Code.fromAsset('dist')

    const layer = new LayerVersion(this, 'AWSLayer', {
      code: Code.fromAsset(path.join('temp', 'layer.zip'), {
        assetHash: getLayerHash('../app-package.json'),
      }),
      compatibleRuntimes: [Runtime.NODEJS_16_X],
      license: 'MIT',
      description: 'Node Modules',
    })

    let certificateArn: string = process.env.AWS_API_CERTIFICATE_ARN!
    let awsCert: ICertificate | undefined = undefined
    awsCert = Certificate.fromCertificateArn(this, 'AWSServiceDistributionCertificate', certificateArn)
    const awsCert_API_GW = Certificate.fromCertificateArn(this, 'AWSServiceGatewayCertificate', process.env.AWS_GATEWAY_CERTIFICATE_ARN!)

    // DynamoDB
    const instanceStateTable = new DynamoTable(this, 'AWSTable')

    // S3
    const s3Storage = new S3Storage(this, 'AWSS3')

    // Roles
    const roles = new Roles(this, 'AWSLambdaRole')

    // Queues
    const queues = new QueuesStack(this, 'AWSQueues')

    // Functions
    const functions = new LambdaStack(this, 'AWSLambdaFunction', roles.role, layer, codeAsset, accountId)

    functions.taskHandlerLambda.addEventSource(new SqsEventSource(queues.taskDelayQueue, { batchSize: 1, reportBatchItemFailures: true }))
    functions.taskHandlerLambda.addEventSource(new SqsEventSource(queues.taskImmQueue, { batchSize: 1, reportBatchItemFailures: true }))

    // *******************************
    // *******************************
    // ***********  HTTP  ************
    // *******************************
    // *******************************

    const api = new HttpApi(this, 'AWSServiceHttpAPI', {
      description: 'Cloud Objects service Http Api',
      createDefaultStage: true,
      defaultDomainMapping: {
        domainName: new DomainName(this, 'AWSAPIGatewayDomainName', {
          domainName: apiDomain,
          certificate: awsCert_API_GW,
        }),
      },
    })

    // *******************************
    // *******************************
    // ********* HTTP ROUTES  ********
    // *******************************
    // *******************************

    new HttpRoute(this, 'AWSApiProxyRoute_' + HttpMethod.ANY, {
      httpApi: api,
      routeKey: HttpRouteKey.with('/{proxy+}', HttpMethod.ANY),
      integration: new HttpLambdaIntegration('proxyInegration', functions.apiHandlerLambda, {
        payloadFormatVersion: PayloadFormatVersion.custom('2.0'),
      }),
    })

    new HttpRoute(this, 'AWSAPIOptionsRoute' + HttpMethod.OPTIONS, {
      httpApi: api,
      routeKey: HttpRouteKey.with('/{options+}', HttpMethod.OPTIONS),
      integration: new HttpLambdaIntegration('proxyInegration', functions.optionsHandlerLambda, {
        payloadFormatVersion: PayloadFormatVersion.custom('2.0'),
      }),
    })

    const origin = new HttpOrigin(`${api.httpApiId}.execute-api.${Aws.REGION}.amazonaws.com`, {
      originSslProtocols: [OriginSslPolicy.TLS_V1_2],
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
      httpPort: 443,
      keepaliveTimeout: Duration.seconds(60),
    })

    // Distribution
    const distribution = new DistributionStack(this, 'AWSDistributionStack', awsCert, api, origin)
  }
}

function getLayerHash(packagePath: string): string {
  const packageJson = require(require.resolve(path.join(packagePath)))
  if (!packageJson) throw new Error('Package json can not found!')

  return crypto.createHmac('sha256', '').update(JSON.stringify(packageJson)).digest('hex')
}

const app = new App()
new DocifierStack(app, 'DocifierStack', { codeHash: Date.now().toString() })
app.synth()
