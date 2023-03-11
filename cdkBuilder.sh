

# # #!/bin/bash 
set -e

npm run build
#npm run obfuscate
npm run copy-templates
npm run create-layer

export AWS_GATEWAY_CERTIFICATE_ARN="arn:aws:acm:eu-west-1:729211218471:certificate/086b379c-2186-4932-b609-0dc666540092"
export AWS_API_CERTIFICATE_ARN="arn:aws:acm:us-east-1:729211218471:certificate/8910e0ab-9f3e-4978-8609-8721c7e53b49"
export AWS_API_TYPE=""
export AWS_REGION="eu-west-1"
export AWS_DOMAIN='api.ihsanceyiz.com'

# npm run cdk -- bootstrap --toolkit-stack-name GoodManStack --qualifier hnb659fds --profile default
# echo "bootstrap finished"

# npm run cdk -- -a "ts-node ./cdk/GoodManStack.ts" synth --context @aws-cdk/core:stackRelativeExports="false" --context @aws-cdk/core:newStyleStackSynthesis="true" --context @aws-cdk/core:bootstrapQualifier="hnb659fds" GoodManStack -q --profile bahadir
# echo "synth finished"
# npm run cdk -- bootstrap --toolkit-stack-name CDKToolkit --qualifier hnb659fds --profile bahadir
# echo "bootstrap finished"

npm run cdk -- deploy --require-approval never GoodManStack --profile bahadir
echo "deploy finished"
