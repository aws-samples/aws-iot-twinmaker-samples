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
python3 ../../cookiefactory/setup_cloud_resources/create_iottwinmaker_workspace_role.py --region $AWS_DEFAULT_REGION > /tmp/create_iottwinmaker_workspace_role.out
TWINMAKER_ROLE_ARN=$(head -n1 /tmp/create_iottwinmaker_workspace_role.out | cut -d " " -f4)
echo "TWINMAKER_ROLE_ARN: ${TWINMAKER_ROLE_ARN}"

# create S3 bucket
aws s3 mb s3://$WS_S3_BUCKET --region $AWS_DEFAULT_REGION
aws s3api put-public-access-block --cli-input-json '{"Bucket": "'$WS_S3_BUCKET'","PublicAccessBlockConfiguration": {"BlockPublicAcls": true,"IgnorePublicAcls": true,"BlockPublicPolicy": true,"RestrictPublicBuckets": true}}' --region $AWS_DEFAULT_REGION
aws s3api put-bucket-cors --cli-input-json '{"Bucket": "'$WS_S3_BUCKET'","CORSConfiguration": {"CORSRules": [{"AllowedHeaders": ["*"],"AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"],"AllowedOrigins": ["*"],"ExposeHeaders": ["ETag"]}]}}' --region $AWS_DEFAULT_REGION

echo "CREATE WORKSPACE JSON"
echo '{"role": "'$TWINMAKER_ROLE_ARN'","s3Location": "arn:aws:s3:::'$WS_S3_BUCKET'","workspaceId": "'$WORKSPACE_ID'"}'

# TODO remove blind sleep
echo "sleep 10 seconds for IAM..."
sleep 10

# create workspace
aws iottwinmaker create-workspace --cli-input-json '{"role": "'$TWINMAKER_ROLE_ARN'","s3Location": "arn:aws:s3:::'$WS_S3_BUCKET'","workspaceId": "'$WORKSPACE_ID'"}' --region $AWS_DEFAULT_REGION >> /dev/null

cdk deploy \
    --context stackName="${CFN_STACK_NAME}" \
    --context iottwinmakerWorkspaceId="$WORKSPACE_ID" \
    --context iottwinmakerWorkspaceBucket="$WS_S3_BUCKET" --require-approval never

# TODO fix in TmdtApp - handling for tiles assets
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


# echo exports to use for app
echo "AWS resources setup complete"