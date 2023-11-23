# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import os

def get_aws_region():
  return os.getenv("AWS_REGION")

def get_bedrock_region():
  return os.getenv("AWS_REGION")

def get_workspace_id():
  return os.getenv("WORKSPACE_ID")
