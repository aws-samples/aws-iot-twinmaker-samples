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

# fill in src/app.config.template.tsx 
cp src/app.config.template.tsx  src/app.config.tsx 
sed_cmd "s/workspaceId: '__FILL_IN__'/workspaceId: '${WORKSPACE_ID}'/" src/app.config.tsx 

CFN_STACK_OUTPUTS=$(aws cloudformation describe-stacks --stack-name "${CFN_STACK_NAME}" --output json | jq '.Stacks[0].Outputs')

COGNITO_CLIENT_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="ClientId").OutputValue')
sed_cmd "s/clientId: '__FILL_IN__'/clientId: '${COGNITO_CLIENT_ID}'/" src/app.config.tsx 
COGNITO_IDEN_POOL_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="IdentityPoolId").OutputValue')
sed_cmd "s/identityPoolId: '__FILL_IN__'/identityPoolId: '${COGNITO_IDEN_POOL_ID}'/" src/app.config.tsx 
sed_cmd "s/region: '__FILL_IN__'/region: '${AWS_DEFAULT_REGION}'/" src/app.config.tsx 
COGNITO_USER_POOL_ID=$(echo $CFN_STACK_OUTPUTS | jq -r '.[] | select(.OutputKey=="UserPoolId").OutputValue')
sed_cmd "s/userPoolId: '__FILL_IN__'/userPoolId: '${COGNITO_USER_POOL_ID}'/" src/app.config.tsx 

COGNITO_PASSWORD=$(aws secretsmanager get-random-password --require-each-included-type --password-length 8 --output text)
sed_cmd "s/password: '__FILL_IN__'/password: '${COGNITO_PASSWORD}'/" src/app.config.tsx 

aws cognito-idp admin-set-user-password --user-pool-id ${COGNITO_USER_POOL_ID} --username "user@cookiefactory" --password "${COGNITO_PASSWORD}" --permanent

echo "dashboard app setup complete"