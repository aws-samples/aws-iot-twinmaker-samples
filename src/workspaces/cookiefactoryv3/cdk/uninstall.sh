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

echo "deleting CFN stack ${CFN_STACK_NAME}..."
aws cloudformation delete-stack --stack-name "${CFN_STACK_NAME}" --region ${AWS_DEFAULT_REGION} && aws cloudformation wait stack-delete-complete --stack-name "${CFN_STACK_NAME}" --region ${AWS_DEFAULT_REGION}

WS_ROLE_ARN=$(aws iottwinmaker get-workspace --workspace-id ${WORKSPACE_ID} --region ${AWS_DEFAULT_REGION} --output json | jq -r ".role")
echo "deleting workspace role: ${WS_ROLE_ARN} ..."
ROLE_NAME=$(echo $WS_ROLE_ARN | cut -d "/" -f2)
npm -g i @iot-app-kit/tools-iottwinmaker
tmdt destroy --region ${AWS_DEFAULT_REGION} --workspace-id ${WORKSPACE_ID} --delete-workspace --delete-s3-bucket --non-dry-run

WORKSPACE_ROLE_POLICIES=$(aws iam list-attached-role-policies --role-name $ROLE_NAME) --output json && \
  echo $WORKSPACE_ROLE_POLICIES | jq '.AttachedPolicies[].PolicyArn' | xargs -I {} aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn {} && \
  echo $WORKSPACE_ROLE_POLICIES | jq '.AttachedPolicies[].PolicyArn' | xargs -I {} aws iam delete-policy --policy-arn {}  && \
  aws iam delete-role --role-name $ROLE_NAME
