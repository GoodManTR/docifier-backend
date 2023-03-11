import { Construct } from 'constructs'
import { AssetHashType, Aws, Duration, Stack, StackProps } from 'aws-cdk-lib'
import { InstanceStateTable } from './items/DynamoTable'
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
import { DomainName, HttpApi, HttpMethod, HttpRoute, HttpRouteKey, PayloadFormatVersion } from '@aws-cdk/aws-apigatewayv2-alpha'
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { OriginProtocolPolicy, OriginSslPolicy } from 'aws-cdk-lib/aws-cloudfront'

interface CosServiceStackProps extends StackProps {
    codeHash: string
}

export const originShield = {
    // Same region mapping
    'us-east-2': 'us-east-2',
    'us-east-1': 'us-east-1',
    'us-west-2': 'us-west-2',
    'ap-south-1': 'ap-south-1',
    'ap-northeast-2': 'ap-northeast-2',
    'ap-southeast-1': 'ap-southeast-1',
    'ap-southeast-2': 'ap-southeast-2',
    'ap-northeast-1': 'ap-northeast-1',
    'eu-central-1': 'eu-central-1',
    'eu-west-1': 'eu-west-1',
    'eu-west-2': 'eu-west-2',
    'sa-east-1': 'sa-east-1',
    // Different region mapping
    'us-west-1': 'us-west-2',
    'af-south-1': 'eu-west-1',
    'ap-east-1': 'ap-southeast-1',
    'ca-central-1': 'us-east-1',
    'eu-south-1': 'eu-central-1',
    'eu-west-3': 'eu-west-2',
    'eu-north-1': 'eu-west-2',
    'me-south-1': 'ap-south-1',
} as any

export class GoodManStack extends Stack {
    constructor(scope: Construct, id: string, props: CosServiceStackProps) {
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
        let retterIOCert: ICertificate | undefined = undefined
        retterIOCert = Certificate.fromCertificateArn(this, 'AWSServiceDistributionCertificate', certificateArn)
        const retterIOCert_API_GW = Certificate.fromCertificateArn(this, 'AWSServiceGatewayCertificate', process.env.AWS_GATEWAY_CERTIFICATE_ARN!)

        // DynamoDB
        const instanceStateTable = new InstanceStateTable(this, 'AWSTable')

        // Roles
        const roles = new Roles(this, 'AWSLambdaRole')

        // Functions
        const functions = new LambdaStack(this, 'AWSLambdaFunction', roles.role, layer, codeAsset, accountId)

        // *******************************
        // *******************************
        // ************* HTTP  ***********
        // *******************************
        // *******************************

        const originShieldRegion: string | undefined = originShield[process.env.AWS_REGION!]
        if (!originShieldRegion) console.log('Origin Shield region could not found so Origin Shield is not activated!')

        const api = new HttpApi(this, 'AWSServiceHttpAPI', {
            description: 'Cloud Objects service Http Api',
            createDefaultStage: true,
            defaultDomainMapping: {
                domainName: new DomainName(this, 'AWSAPIGatewayDomainName', {
                    domainName: apiDomain,
                    certificate: retterIOCert_API_GW,
                }),
            },
        })

        // *******************************
        // *******************************
        // ********* HTTP ROUTES  ********
        // *******************************
        // *******************************

        new HttpRoute(this, 'COSApiProxyRoute_' + HttpMethod.POST, {
            httpApi: api,
            routeKey: HttpRouteKey.with('/{proxy+}', HttpMethod.POST),
            integration: new HttpLambdaIntegration('proxyInegration', functions.apiHandlerLambda, {
                payloadFormatVersion: PayloadFormatVersion.custom('2.0'),
            }),
        })

        const origin = new HttpOrigin(`${api.httpApiId}.execute-api.${Aws.REGION}.amazonaws.com`, {
            originSslProtocols: [OriginSslPolicy.TLS_V1_2],
            protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
            httpPort: 443,
            keepaliveTimeout: Duration.seconds(60),
            originShieldRegion,
        })

        // Distribution
        const distribution = new DistributionStack(this, 'AWSDistributionStack', retterIOCert, api, origin)
    }
}

function getLayerHash(packagePath: string): string {
    const packageJson = require(require.resolve(path.join(packagePath)))
    if (!packageJson) throw new Error('Package json can not found!')
  
    return crypto.createHmac('sha256', '').update(JSON.stringify(packageJson)).digest('hex')
}

const app = new App()
new GoodManStack(app, 'GoodManStack', { codeHash: Date.now().toString() })
app.synth()
