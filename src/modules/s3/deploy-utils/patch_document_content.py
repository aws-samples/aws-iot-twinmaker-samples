# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3
import time

'''
This utility patch document to iottwinmaker entity
'''


def parse_args():
    parser = argparse.ArgumentParser(
        description='Patch document to iottwinmaker entity example.')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the sample in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')

    parser.add_argument('--workspace-id', required=True, help='workspace to be populated')

    parser.add_argument('--entity-id', required=True, help='entity id to patch the document') 
    parser.add_argument('--document-name', required=True, help='document name')
    parser.add_argument('--external-url', required=True, help='external url for the document')
    parser.add_argument('--usage', required=False, help='print usage sample')

    return parser.parse_args()

def print_usage():
    print("""Usage:
    In command line

    python3 ./patch_document_content.py --workspace-id CookieFactory --entity-id WaterTank_ce63b782-c855-4cff-8d1c-6e542e0a3cbf --document-name mydoc1 --external-url https://github.com/grafana

    """)


def main():

    args = parse_args()
    if args.usage is not None:
        print_usage()

    region = args.region
    endpoint_url = args.endpoint_url
    workspace_id = args.workspace_id
    entity_id = args.entity_id
    document_name = args.document_name
    external_url = args.external_url

    session = boto3.session.Session()

    iottwinmaker = session.client(service_name='iottwinmaker', region_name=region)

    update_entity = iottwinmaker.update_entity(
        componentUpdates={
            "ExternalDocumentLink": {
                "updateType": "CREATE",
                "componentTypeId": "com.amazon.iottwinmaker.documents",
                "propertyUpdates": {
                    "documents": {
                        "updateType": "UPDATE",
                        "value": {
                            "mapValue": {
                                document_name : { 
                                    "stringValue": external_url
                                }
                            }
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
