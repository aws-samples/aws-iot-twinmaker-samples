# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import boto3
import json
import logging
import os
import re
import time

## Parameter columns on interest.
ATTR_NAME_COL=9
ATTR_VALUE_COL=10
ATTR_PI_PT_COL=11

LAST_PARENT_IDX=8

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

def log(message):
    LOGGER.info(message)

# Log non 200 responses or non api responses
def api_report(response):
    m = response.get('ResponseMetadata')
    if m:
        s = m.get('HTTPStatusCode')
        if s:
            c = int(s)
            if c != 200:
                log("Error: " + str(response))
        else:
            log(str(response))
    else:
        log(str(response))

def boto3_session(profile = 'default', region = 'us-east-1'):
    s = boto3.Session(
        #profile_name = profile if profile else os.environ.get('AWS_PROFILE'),
        region_name = region if region else os.environ.get('AWS_REGION' ))
    #s = boto3.Session( profile_name = 'mykey', region_name = 'us-east-1')
    return s



def get_role_from_identity():
    sts = boto3_session().client('sts')
    identt = sts.get_caller_identity()
    ws_arn = "/".join(identt.get('Arn').split("/")[:-1])
    return re.sub(r":sts:",":iam:",re.sub('assumed-','',ws_arn))

## Custom waiter, sort of...
## jq python cannot handle datetime, so using this function
## only supports nested dicts, no support for list yet.
def wait_over(aws_api, api_params, nested_jq_path,
                    expected_value, timeout=30, hop=1):
    if timeout <= 0:
        #print("Timed out")
        return False
    ## Start with sleep, just in case the original call has not yet gone through
    time.sleep(hop)
    resource = aws_api(**api_params)
    keys = nested_jq_path.split(".")
    for k in keys:
        resource = resource.get(k)
    if expected_value == resource:
        return True
    else:
        #print("waiting.." + str(timeout) + " seconds")
        return wait_over(aws_api, api_params, nested_jq_path,
                            expected_value, timeout-1, hop)

## Save formatted json data to S3. data is expected to be json string.
def s3_save(bucket, obj_name, data):
    s3 = boto3_session().resource('s3')
    s3object = s3.Object(bucket_name = bucket, key = obj_name)
    s3object.put(
        Body=(bytes(json.dumps(data).encode('UTF-8'))) )


# Replace spaces with '_'
def underscored(s):
    #return re.sub(r'_$','',re.sub(r'_{2,}', '_',re.sub(r'[^0-9a-zA-Z]','_',s)))
    ## temporarily prepend an 'a' if the first char is a digit
    return re.sub(r'_{2,}', '_', re.sub(r'[^0-9a-zA-Z_-]','_',s))


## method to give full results of a AWS api call iterating with nextTokens
def all_results( api_name, params, response_key, initial_seed=200):
    results=[]
    hasMoreResults = True
    next_token=None
    while hasMoreResults:
        if next_token:
            resp = api_name(**params, maxResults=2, nextToken=next_token)
        else:
            resp = api_name(**params, maxResults=2)
        result = resp.get(response_key)
        results = results + result
        next_token = resp.get('nextToken')
        hasMoreResults = False if not next_token else True

    return results


def get_snowflake_credentials(secrets):
    sm = boto3_session().client("secretsmanager")
    secret = sm.get_secret_value( SecretId=secrets)
    creds = json.loads(secret['SecretString'])
    return creds


def load_env():
    aws_data_path = set(os.environ.get('AWS_DATA_PATH', '').split(os.pathsep))
    aws_data_path.add("/opt/models")
    os.environ.update({
        'AWS_DATA_PATH': os.pathsep.join(aws_data_path)
    })
