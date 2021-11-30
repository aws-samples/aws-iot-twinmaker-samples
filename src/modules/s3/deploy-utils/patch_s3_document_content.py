# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3
import time

'''
This utility patch s3 document to iottwinmaker entity
'''


def parse_args():
    parser = argparse.ArgumentParser(
        description='Patch s3 document to iottwinmaker entity example.')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the sample in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')

    parser.add_argument('--workspace-id', required=True, help='workspace to be populated')

    parser.add_argument('--entity-id', required=True, help='entity id to patch with snowflake connector') 
    parser.add_argument('--component-type-id', required=True, help='component type id of snowflake connector') 
    parser.add_argument('--component-name', required=False, help='component name to attach with entity', default='S3Connector')
    parser.add_argument('--s3-url-json', required=True, help='s3 url for json file to attach with entity')
    parser.add_argument('--usage', required=False, help='print usage sample')

    return parser.parse_args()

def print_usage():
    print("""Usage:
    In command line

    python3 ./patch_s3_document_content.py --workspace-id CookieFactory --entity-id Mixer_0_cd81d9fd-3f74-437a-802b-9747ff240837 --component-type-id com.example.s3connector.document --s3-url-json s3://workspace-cookiefactory/operation/operation_status.json

    """)


def main():
    
    args = parse_args()
    if args.usage is not None:
        print_usage()

    region = args.region
    workspace_id = args.workspace_id
    entity_id = args.entity_id 
    component_type_id = args.component_type_id
    component_name = args.component_name
    s3_url = args.s3_url_json

    session = boto3.session.Session()

    iottwinmaker = session.client(service_name='iottwinmaker', region_name=region)

    update_entity = iottwinmaker.update_entity(
        componentUpdates={
            component_name: {
                    "updateType": "CREATE",
                    "componentTypeId": component_type_id,
                    "propertyUpdates": {
                        "s3Url": {
                            "updateType": "UPDATE",
                            "value": {
                                "stringValue": s3_url
                            } 
                        }
                    }
            }
        },
        entityId = entity_id,
        workspaceId = workspace_id)
    print(update_entity)

    state = update_entity['state']
    while state == 'UPDATING':
        time.sleep(1)
        entity_description = iottwinmaker.get_entity(entityId= entity_id, workspaceId=workspace_id)
        state = entity_description['status']['state']
        print(f'{state}')

if __name__ == '__main__':
    main()
