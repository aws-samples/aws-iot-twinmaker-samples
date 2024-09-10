#!/bin/sh

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

# List of environment variables to check
vars=("AWS_DEFAULT_REGION" "CDK_DEFAULT_ACCOUNT" "WORKSPACE_ID" "CFN_STACK_NAME")

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

export WS_S3_BUCKET=twinmaker-cfv3-$AWS_DEFAULT_REGION-$CDK_DEFAULT_ACCOUNT-$(echo "$WORKSPACE_ID" | tr '[:upper:]' '[:lower:]')
echo "WS_S3_BUCKET: ${WS_S3_BUCKET}"

# GetAuthorizationToken command is only supported in us-east-1
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws

npm install

python3 -m pip install boto3

# Check if the S3 bucket already exists
if aws s3api head-bucket --bucket "$WS_S3_BUCKET" 2>/dev/null; then
  echo "S3 bucket already exists: $WS_S3_BUCKET"
else
  echo "Creating S3 bucket..."
  aws s3 mb s3://$WS_S3_BUCKET --region $AWS_DEFAULT_REGION
  aws s3api put-public-access-block --cli-input-json '{"Bucket": "'$WS_S3_BUCKET'","PublicAccessBlockConfiguration": {"BlockPublicAcls": true,"IgnorePublicAcls": true,"BlockPublicPolicy": true,"RestrictPublicBuckets": true}}' --region $AWS_DEFAULT_REGION
  aws s3api put-bucket-cors --cli-input-json '{"Bucket": "'$WS_S3_BUCKET'","CORSConfiguration": {"CORSRules": [{"AllowedHeaders": ["*"],"AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"],"AllowedOrigins": ["*"],"ExposeHeaders": ["ETag"]}]}}' --region $AWS_DEFAULT_REGION
fi

# Check if the workspace already exists
WORKSPACE_EXISTS=$(aws iottwinmaker get-workspace --workspace-id "$WORKSPACE_ID" --query 'workspaceId' --output text 2>/dev/null || true)

if [ -z "$WORKSPACE_EXISTS" ]; then
  echo "create twinmaker role"
  python3 ../../cookiefactory/setup_cloud_resources/create_iottwinmaker_workspace_role.py --region $AWS_DEFAULT_REGION > /tmp/create_iottwinmaker_workspace_role.out
  echo "sleep 10 seconds for IAM..."
  sleep 10

  TWINMAKER_ROLE_ARN=$(head -n1 /tmp/create_iottwinmaker_workspace_role.out | cut -d " " -f4)

  echo "CREATE WORKSPACE JSON"
  echo '{"role": "'$TWINMAKER_ROLE_ARN'","s3Location": "arn:aws:s3:::'$WS_S3_BUCKET'","workspaceId": "'$WORKSPACE_ID'"}'
  
  aws iottwinmaker create-workspace --cli-input-json '{"role": "'$TWINMAKER_ROLE_ARN'","s3Location": "arn:aws:s3:::'$WS_S3_BUCKET'","workspaceId": "'$WORKSPACE_ID'"}' --region $AWS_DEFAULT_REGION >> /dev/null
else
  echo "IoT TwinMaker workspace already exists: $WORKSPACE_ID"
fi

echo "STACK_NAME=$CFN_STACK_NAME"

cdk deploy \
    --context stackName="$CFN_STACK_NAME" \
    --context iottwinmakerWorkspaceId="$WORKSPACE_ID" \
    --context iottwinmakerWorkspaceBucket="$WS_S3_BUCKET" --require-approval never

# TODO fix in TmdtApp - handlinr tiles assets
aws s3 cp --recursive ../tmdt_project/3d_models/ s3://${WS_S3_BUCKET}

# verify data connector accessible
aws iottwinmaker get-property-value-history  --cli-input-json '{
    "workspaceId": "'$WORKSPACE_ID'",
    "entityId": "INSPECTOR_POST_FREEZER_TUNNEL_999d8796-55f1-4791-af53-fc210038686f",
    "componentName": "rateEquipment",
    "selectedProperties": [
        "State"
    ],
    "startDateTime": "1899-12-31T08:00:00.000",
    "endDateTime": "2023-11-18T16:46:41.186",
    "maxResults": 1,
    "orderByTime": "DESCENDING"
}' --region $AWS_DEFAULT_REGION > /tmp/out.txt
cat /tmp/out.txt

SECRET_NAME="CFV3Secrets"

SECRET=$(aws secretsmanager get-secret-value --secret-id $SECRET_NAME --query SecretString --output text)

if [ $? -ne 0 ]; then
  echo "Error: Failed to retrieve the secret with ID $SECRET_NAME .The secret may not exist or you do not have permissions to access it."
  exit 1
fi

COMPANY_ASSETS_BUCKET_NAME=$(echo $SECRET | jq -r '.companyAssetsBucketName')
ORIGIN_ACCES_ID=$(echo $SECRET | jq -r '.originAccessIdentityId')

echo "ORIGIN_ACCES_ID: $ORIGIN_ACCES_ID"


cdk deploy \
    --context stackName="CookieFactoryV3ChainlitStack" \
    --context secretName="$SECRET_NAME" \
    --context companyAssetsBucketName="$COMPANY_ASSETS_BUCKET_NAME" \
    --context originAccessIdentityId="$ORIGIN_ACCES_ID" \
    --require-approval never


# echo exports to use for app
echo "AWS resources setup complete"