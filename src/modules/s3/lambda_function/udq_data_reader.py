# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import logging
import sys
from datetime import datetime

import boto3
import json

import udq_constants
import udq_param_parser


LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)


SESSION = boto3.Session()
s3_client = SESSION.client('s3')

# Main Lambda invocation entry point, use the TimestreamReader to process events
# noinspection PyUnusedLocal
def lambda_handler(event, context):
    LOGGER.info('Event: %s', event)
    s3Reader = S3AttributeReader(s3_client)
    result = s3Reader.entity_query(event)

    LOGGER.info(f"result: {result}")

    return result



class S3AttributeReader:

    def __init__(self, s3_client):
        self.s3_client = s3_client

    def _split_s3_path(self, s3_path):
        path_parts=s3_path.replace("s3://","").split("/")
        bucket=path_parts.pop(0)
        key="/".join(path_parts)
        return bucket, key

    def _read_s3_file_content(self, s3Bucket, filePath):
        s3_obj = self.s3_client.get_object(Bucket=s3Bucket, Key=filePath)
        string_json = s3_obj['Body'].read().decode('utf-8')
        return json.loads(string_json)

    def _formated_return(self, entity_id, component_name, operation_status):
        property_values = {
            "operationStatus": {
                "propertyReference": {
                    "propertyName": "operationStatus",
                    "entityId": entity_id,
                    "componentName": component_name,
                },
                "propertyValue": {
                    "stringValue": operation_status
                }
            }
        }

        return {
            'propertyValues': property_values
        }

    def entity_query(self, event):

        param_parser = udq_param_parser.UDQParamsParser(event)
        workspace_id = param_parser.get_workspace_id()
        entity_id = param_parser.get_entity_id()
        component_name = param_parser.get_component_name()
        s3_url = param_parser.get_s3_url()
        s3_bucket, file_path = self._split_s3_path(s3_url)
        operation_status = "NotDefined"

        jvalues = self._read_s3_file_content(s3_bucket, file_path)

        for value in jvalues["propertyValues"]:
            if workspace_id == value.get("workspaceId") and entity_id == value.get("entityId") and component_name == value.get("componentName"):
                operation_status = "NotDefined" if value.get("operationStatus") is None else value["operationStatus"]
                break
        
        return self._formated_return(entity_id, component_name, operation_status)

        



