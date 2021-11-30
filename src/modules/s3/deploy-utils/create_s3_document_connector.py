# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3

'''
This utility creates a s3 document connector component type.
'''


def parse_args():
    parser = argparse.ArgumentParser(
        description='Create a s3 document connector component type.')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the component type in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')

    parser.add_argument('--workspace-id', required=True, help='workspace id that the conponent belongs to')
    parser.add_argument('--component-type-id', required=False, help="Component type id is used to identify the connector.",  default='com.example.s3connector.document') 
    parser.add_argument('--attribute-property-value-reader-by-entity-arn', required=True, help='ARN of attributePropertyValueReaderByEntity lambda') 
    parser.add_argument('--usage', required=False, help='print usage sample')

    return parser.parse_args()

def print_usage():
    print("""
    python3 ./create_s3_document_connector.py \
    --workspace-id CookieFactory \
    --component-type-id com.example.s3connector.document \
    --attribute-property-value-reader-by-entity-arn arn:aws:lambda:us-east-1:{account}:function:IoTTwinMakerCookieFactoryS3-s3ReaderUDQ*** 
    """)

def list_component_type_ids(iottwinmaker, workspace_id):
    componentTypeIds = []
    response = iottwinmaker.list_component_types(workspaceId = workspace_id)
    nextToken = response.get('nextToken')
    for componentType in response['componentTypeSummaries']:
        componentTypeIds.append(componentType['componentTypeId'])

    while nextToken is not None:
        response = iottwinmaker.list_component_types(workspaceId = workspace_id, nextToken = nextToken)
        nextToken = response.get('nextToken')
        for componentType in response['componentTypeSummaries']:
            componentTypeIds.append(componentType['componentTypeId'])

    return componentTypeIds


def main():

    args = parse_args()
    if args.usage is not None:
        print_usage()

    region = args.region
    workspace_id = args.workspace_id
    component_type_id = args.component_type_id
    attribute_reader_arn = args.attribute_property_value_reader_by_entity_arn
 
    session = boto3.session.Session()
    iottwinmaker = session.client(service_name='iottwinmaker', region_name=region)

    # check if the component type id already exists
    componentTypeIds = list_component_type_ids(iottwinmaker, workspace_id)
    if component_type_id in componentTypeIds:
        print(f"ComponentTypeId : {component_type_id} already exists in the workspace {workspace_id}")
        return

    response = iottwinmaker.create_component_type(
        workspaceId = workspace_id, 
        componentTypeId = component_type_id,
        isSingleton = True,
        propertyDefinitions = {
            "s3Url": {
                "dataType": {
                    "type": "STRING"
                },
                "isTimeSeries": False,
                "isStoredExternally": False
            },
            "operationStatus": {
                "dataType": {
                    "type": "STRING"
                },
                "isTimeSeries": False,
                "isStoredExternally": True
            }
        },
        functions= {
            "attributePropertyValueReaderByEntity": {
                "scope": "ENTITY",
                "implementedBy": {
                    "isNative": False,
                    "lambda": {
                        "arn": attribute_reader_arn
                    }
                }
            }
        }
    )
    print(response)

if __name__ == '__main__':
    main()
