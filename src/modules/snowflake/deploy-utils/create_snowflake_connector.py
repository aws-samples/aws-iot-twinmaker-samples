# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3

'''
This utility creates a snowflake connector component type.
'''


def parse_args():
    parser = argparse.ArgumentParser(
        description='Create a snowflake connector component type.')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the component type in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')

    parser.add_argument('--endpoint-url', required=False, default=None, help='iottwinmaker service endpoint')
    parser.add_argument('--workspace-id', required=True, help='workspace id that the conponent belongs to')

    parser.add_argument('--component-type-id', required=False, help="Component type id is used to identify the connector. Defaults to 'com.amazon.SnowflakeConnector'") 
    parser.add_argument('--entity-property-table-name', required=True, help='the snowflake table that contains entity properties') 
    parser.add_argument('--timeseries-table-name', required=True, help='the snowflake table that contains timeseries data.')
    parser.add_argument('--schema-initializer-arn', required=True, help='ARN of schema initializer lambda') 
    parser.add_argument('--data-reader-by-entity-arn', required=True, help='ARN of timeseries data reader lambda.') 

    return parser.parse_args()

def print_usage():
    print("""
    python3 ./create_snowflake_connector.py \
    --workspace-id CookieFactory \
    --component-type-id com.example.iottwinmaker.snowflake.connector \
    --entity-property-table-name {property_table_name} \
    --timeseries-table-name {time_series_table_name} \
    --schema-initializer-arn arn:aws:lambda:us-east-1:{account}:function:SnowflakeSchemaInitializer \
    --data-reader-by-entity-arn arn:aws:lambda:us-east-1:{account}:function:SnowflakeDataReaderByEntity
    """)
    pass

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
    
    print_usage()

    args = parse_args()
    region = 'us-east-1' if args.region is None else args.region
    endpoint_url = args.endpoint_url
    workspace_id = args.workspace_id
    component_type_id = 'com.example.SnowflakeConnector' if args.component_type_id is None else args.component_type_id
    entity_property_table_name = args.entity_property_table_name
    timeseries_table_name = args.timeseries_table_name
    schema_initializer_arn = args.schema_initializer_arn
    data_reader_by_entity_arn = args.data_reader_by_entity_arn
    
    session = boto3.session.Session()
    iottwinmaker = session.client(service_name='iottwinmaker', endpoint_url=endpoint_url, region_name=region)

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
            "elemId": {
                "dataType": {
                    "type": "STRING"
                },
                "isTimeSeries": False,
                "isRequiredInEntity": True,
                "isExternalId": True
            },
            "entityPropertyTableName": {
                "dataType": {
                    "type": "STRING"
                },
                "isTimeSeries": False,
                "defaultValue": {
                    "stringValue": entity_property_table_name
                }
            },
            "timeseriesTableName": {
                "dataType": {
                    "type": "STRING"
                },
                "isTimeSeries": True,
                "isStoredExternally": False,
                "defaultValue": {
                    "stringValue": timeseries_table_name
                }
            }
        },
        functions = {
            "schemaInitializer": {
                "scope": "ENTITY",
                "implementedBy": {
                    "lambda": {
                        "arn": schema_initializer_arn
                    }
                },
                "requiredProperties": [
                    "elemId",
                    "entityPropertyTableName"
                ]
            },
            "dataReaderByEntity": {
                "scope": "ENTITY",
                "implementedBy": {
                    "lambda": {
                        "arn": data_reader_by_entity_arn
                    }
                }
            }
        }
    )
    print(response)

if __name__ == '__main__':
    main()
