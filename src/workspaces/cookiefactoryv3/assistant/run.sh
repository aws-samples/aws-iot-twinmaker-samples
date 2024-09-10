#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

SECRET_NAME="CFV3Secrets"

SECRET=$(aws secretsmanager get-secret-value --secret-id $SECRET_NAME --query SecretString --output text)

echo $SECRET

if [ $? -ne 0 ]; then
  echo "Error: Failed to retrieve the secret with ID CFV3Secrets. The secret may not exist or you do not have permissions to access it."
  exit 1
fi


COGNITO_CLIENT_ID=$(echo $SECRET | jq -r '.clientId')
COGNITO_IDEN_POOL_ID=$(echo $SECRET | jq -r '.identityPoolId')
COGNITO_USER_POOL_ID=$(echo $SECRET | jq -r '.userPoolId')
AWS_REGION=$(echo $SECRET | jq -r '.region')
DOCS_BUCKET_NAME=$(echo $SECRET | jq -r '.companyAssetsBucketName')
CLOUDFRONT_DIST=$(echo $SECRET | jq -r '.distributionDomainName')

WORKSPACE_ID=$(echo $SECRET | jq -r '.workspaceId')
KNOWLEDGE_BASE_ID=$(echo $SECRET | jq -r '.knowledgeBaseId')


export AWS_REGION=$AWS_REGION
export WORKSPACE_ID=$WORKSPACE_ID
export KNOWLEDGE_BASE_ID=$KNOWLEDGE_BASE_ID
export OAUTH_COGNITO_CLIENT_ID=$4
export OAUTH_COGNITO_CLIENT_SECRET=$5
export OAUTH_COGNITO_DOMAIN=$6

chainlit run app/bedrock.py --port 8000
