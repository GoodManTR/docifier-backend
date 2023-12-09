import { Construct } from 'constructs'
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda'
import * as path from 'path'

export class ServiceLayer extends Construct {
    public readonly layer: LayerVersion

    constructor(scope: Construct, id: string, defaultSourcePath: string) {
        super(scope, id)

        this.layer = new LayerVersion(this, id, {
            code: Code.fromAsset(path.join(defaultSourcePath, 'temp', 'modules.zip')),
            compatibleRuntimes: [Runtime.NODEJS_16_X],
            license: 'MIT',
            description: 'AWS service node modules',
        })
    }
}