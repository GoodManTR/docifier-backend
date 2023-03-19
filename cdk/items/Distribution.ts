import { Construct } from 'constructs'
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'
import {
    AllowedMethods,
    CacheCookieBehavior,
    CachedMethods,
    CacheHeaderBehavior,
    CachePolicy,
    CacheQueryStringBehavior,
    Distribution,
    OriginProtocolPolicy,
    OriginRequestHeaderBehavior,
    OriginRequestPolicy,
    OriginRequestQueryStringBehavior,
    OriginSslPolicy,
    PriceClass,
    ResponseHeadersPolicy,
    ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Duration } from 'aws-cdk-lib'
import { HttpOrigin, RestApiOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { HttpApi } from '@aws-cdk/aws-apigatewayv2-alpha'
import { RestApi } from 'aws-cdk-lib/aws-apigateway'

export class DistributionStack extends Construct {
    public readonly coreApiDistribution: Distribution

    constructor(scope: Construct, id: string, certificate: ICertificate, api: RestApi | HttpApi | undefined = undefined, origin: HttpOrigin | RestApiOrigin | undefined = undefined ) {
        super(scope, id)

        const apiDomain = process.env.AWS_DOMAIN!
        const domainNames = [apiDomain]

        this.coreApiDistribution = new Distribution(this, 'AWSApiDistribution', {
            priceClass: PriceClass.PRICE_CLASS_ALL,
            domainNames,
            certificate: certificate!,
            defaultBehavior: {
                compress: true,
                cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
                viewerProtocolPolicy: ViewerProtocolPolicy.HTTPS_ONLY,
                allowedMethods: AllowedMethods.ALLOW_ALL,
                origin: origin!,
                cachePolicy: new CachePolicy(this, 'AWSServiceOriginCachePolicy', {
                    cachePolicyName: 'AWSServiceOriginCachePolicy',
                    minTtl: Duration.seconds(0),
                    maxTtl: Duration.days(365),
                    defaultTtl: Duration.seconds(0),
                    cookieBehavior: CacheCookieBehavior.none(),
                    headerBehavior: CacheHeaderBehavior.none(),
                    queryStringBehavior: CacheQueryStringBehavior.denyList('_token'),
                    enableAcceptEncodingGzip: true,
                    enableAcceptEncodingBrotli: true,
                }),
                originRequestPolicy: new OriginRequestPolicy(this, 'AWSServiceOriginRequestPolicy', {
                    originRequestPolicyName: 'AWSServiceOriginRequestPolicy',
                    headerBehavior: OriginRequestHeaderBehavior.all(),
                    queryStringBehavior: OriginRequestQueryStringBehavior.all(),
                }),
                responseHeadersPolicy: new ResponseHeadersPolicy(this, 'AWSServiceResponseHeadersPolicy', {
                    responseHeadersPolicyName: 'AWSServiceResponseHeadersPolicy',
                    corsBehavior: {
                        accessControlAllowHeaders: ['*'],
                        accessControlAllowMethods: ['POST', 'GET', 'OPTIONS', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
                        accessControlAllowOrigins: ['*'],
                        accessControlExposeHeaders: ['*'],
                        accessControlAllowCredentials: false,
                        originOverride: false
                    },
                })
            },
        })
        this.coreApiDistribution.node.addDependency(api!)
    }
}