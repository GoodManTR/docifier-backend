

# # #!/bin/bash 
set -e

npm run build
npm run copy-templates
npm run create-layer

export AWS_GATEWAY_CERTIFICATE_ARN="arn:aws:acm:eu-west-1:959503346295:certificate/b5b26d31-12a9-4f25-a116-9863e27b0cc5"
export AWS_API_CERTIFICATE_ARN="arn:aws:acm:us-east-1:959503346295:certificate/16ac64c7-2f97-4328-a19f-af9042cd4bfb"
export AWS_API_TYPE=""
export AWS_REGION="eu-west-1"
export AWS_DOMAIN='api.goodmanio.net'

# npm run cdk -- -a "ts-node ./cdk/DocifierStack.ts" synth --context @aws-cdk/core:stackRelativeExports="false" --context @aws-cdk/core:newStyleStackSynthesis="true" --context @aws-cdk/core:bootstrapQualifier="hnb659fds" DocifierStack -q --profile docifier-bahadir
# echo "synth finished"
# npm run cdk -- bootstrap --toolkit-stack-name CDKToolkit --qualifier hnb659fds --profile docifier-bahadir
# echo "bootstrap finished"

npm run cdk -- deploy --require-approval never DocifierStack --profile docifier-bahadir
echo "deploy finished"