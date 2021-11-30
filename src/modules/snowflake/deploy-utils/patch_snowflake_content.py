# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3

'''
This utility patch snowflake to iottwinmaker entity
'''


def parse_args():
    parser = argparse.ArgumentParser(
        description='Patch document to iottwinmaker entity example.')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the sample in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')

    parser.add_argument('--endpoint-url', required=False, default=None, help='iottwinmaker service endpoint')
    parser.add_argument('--workspace-id', required=True, help='workspace to be populated')

    parser.add_argument('--entity-id', required=True, help='entity id to patch with snowflake connector') 
    parser.add_argument('--component-type-id', required=True, help='component type id of snowflake connector') 
    parser.add_argument('--component-name', required=False, help='component name to attach with entity')

    return parser.parse_args()


def main():
    
    args = parse_args()
    region = args.region
    endpoint_url = args.endpoint_url
    workspace_id = args.workspace_id
    entity_id = args.entity_id 
    component_type_id = args.component_type_id
    component_name = 'SnowflakeConnector' if args.component_name is None else args.component_name

    session = boto3.session.Session()

    iottwinmaker = session.client(service_name='iottwinmaker', endpoint_url=endpoint_url, region_name=region)

    update_entity = iottwinmaker.update_entity(
        componentUpdates={
            component_name: {
                    "updateType": "CREATE",
                    "componentTypeId": component_type_id,
                    "propertyUpdates": {
                        "elemId": {
                            "updateType": "UPDATE",
                            "value": {
                                "stringValue": entity_id
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
        entity_description = iottwinmaker.get_entity(entityId= entity_id, workspaceId=workspace_id)
        state = entity_description['status']['state']
        print(f'{state}')

if __name__ == '__main__':
    main()
