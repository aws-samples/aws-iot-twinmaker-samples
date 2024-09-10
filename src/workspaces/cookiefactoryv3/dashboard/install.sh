#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# List of environment variables to check
vars=("AWS_DEFAULT_REGION" "WORKSPACE_ID" "CFN_STACK_NAME")

# Loop through list and check if each variable is set
for var in "${vars[@]}"
do
  if [ -z "${!var}" ] 
  then
    echo "Environment variable $var is not set"
    exit 1
  else
    echo "Environment variable $var is set to ${!var}"  
  fi
done

set -e
trap 'echo "******* FAILED *******" 1>&2' ERR

npm install

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS sed 
  echo "running on OSX..."
  alias sed_cmd="sed -i ''"
else
  # Linux sed
  echo "running on Linux..."
  alias sed_cmd="sed -i"
fi


# Retrieve secret values from Secrets Manager

# echo "Retrieving secret from Secrets Manager..."
# COOKIE_FACTORY_SECRET=$(aws secretsmanager get-secret-value --secret-id CFV3Secrets --query SecretString --output text)

# if [ $? -ne 0 ]; then
#   echo "Error: Failed to retrieve the secret with ID CFV3Secrets. The secret may not exist or you do not have permissions to access it."
#   exit 1
# fi
# SECRET_NAME="CFV3Secrets"


CFN_STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "${CFN_STACK_NAME}" --output json | jq '.Stacks[0].Outputs')

COGNITO_CLIENT_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolClientId").OutputValue')
COGNITO_IDEN_POOL_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="IdentityPoolId").OutputValue')
COGNITO_USER_POOL_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId").OutputValue')
COMPANY_ASSETS_BUCKET_NAME=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="CompanyAssetsBucketName").OutputValue')
CLOUDFRONT_DIST=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="DistributionDomainName").OutputValue')
REGION=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="Region").OutputValue')
KNOWLEDGE_BASE_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="KnowledgeBaseID").OutputValue')


CHAINLIT_STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "CookieFactoryV3ChainlitStack" --output json | jq '.Stacks[0].Outputs')
echo "CHAINLIT_STACK_OUTPUTS: $CHAINLIT_STACK_OUTPUTS"

CHAINLIT_URL=$(echo $CHAINLIT_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="ChainlitURL").OutputValue')

echo "CHAINLIT_URL: $CHAINLIT_URL"

# Fill in src/app.config.template.tsx 
cp src/app.config.template.tsx  src/app.config.tsx 
sed_cmd "s/workspaceId: '__FILL_IN__'/workspaceId: '${WORKSPACE_ID}'/" src/app.config.tsx 
sed_cmd "s/clientId: '__FILL_IN__'/clientId: '${COGNITO_CLIENT_ID}'/" src/app.config.tsx 
sed_cmd "s/identityPoolId: '__FILL_IN__'/identityPoolId: '${COGNITO_IDEN_POOL_ID}'/" src/app.config.tsx 
sed_cmd "s/region: '__FILL_IN__'/region: '${AWS_DEFAULT_REGION}'/" src/app.config.tsx 
sed_cmd "s/userPoolId: '__FILL_IN__'/userPoolId: '${COGNITO_USER_POOL_ID}'/" src/app.config.tsx 


sed_cmd "s|chainlitUrl = '__FILL_IN__'|chainlitUrl = '${CHAINLIT_URL}'|" src/app.config.tsx 

echo "build front end"
npm run build


# Check if the dashboard directory exists
if [ ! -d "./dist" ]; then
  echo "Directory /dist does not exist."
  exit 1
fi

aws s3 sync "./dist" "s3://$COMPANY_ASSETS_BUCKET_NAME/web/" --delete

echo "application is deployed at https://$CLOUDFRONT_DIST"

echo "dashboard app setup complete"