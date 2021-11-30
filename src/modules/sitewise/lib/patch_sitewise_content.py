# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3
import sys
import os
import time

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../modules'))
from sitewise.lib.util.SiteWiseTelemetryUtils import SiteWiseTelemetryImporter

'''
This utility creates a workspace role with necessary permissions for this CookieFactory sample
'''


def parse_args():
    parser = argparse.ArgumentParser(
        description='Creates a role for the AWS IoT TwinMaker workspace for this CookieFactory sample.')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the sample in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')
    parser.add_argument('--profile',
                        help="(optional) AWS profile to access your account with. See your configured profiles with "
                             "`~/.aws/credentials`. Defaults to 'None'",
                        required=False, default=None)
    parser.add_argument('--endpoint-url', required=False, default=None, help='iottwinmaker service endpoint')
    parser.add_argument('--workspace-id', required=True, help='workspace to be populated')
    return parser.parse_args()


def main():
    args = parse_args()
    region = args.region
    profile = args.profile
    endpoint_url = args.endpoint_url
    workspace_id = args.workspace_id

    session = boto3.session.Session(profile_name=profile)

    iottwinmaker_client = session.client(service_name='iottwinmaker', endpoint_url=endpoint_url, region_name=region)
    sitewise_client = session.client('iotsitewise', region)

    sitewiseImporter = SiteWiseTelemetryImporter(args.region, asset_model_prefix=workspace_id)
    models = [x for x in sitewiseImporter.get_models(workspace_id) if 'WaterTank' in x['name']]
    print(models)
    assert len(models) == 1
    model_name = models[0]['name']
    model_id = models[0]['assetModelId']
    assets = sitewiseImporter.get_assets_by_model_id(model_id)
    assert len(assets) == 1

    asset_id = assets[0]['assetId']

    try:
        update_entity = iottwinmaker_client.update_entity(
            componentUpdates={
                "WaterTankVolume": {
                    "updateType": "CREATE",
                    "componentTypeId": "com.amazon.iotsitewise.connector",
                    "propertyUpdates": {
                        "sitewiseAssetId": {
                            "updateType": "UPDATE",
                            "value": {
                                "stringValue": asset_id
                            }
                        },
                        "sitewiseAssetModelId": {
                            "updateType": "UPDATE",
                            "value": {
                                "stringValue": model_id
                            }
                        }
                    }
                }
            },
            entityId = 'WaterTank_ab5e8bc0-5c8f-44d8-b0a9-bef9c8d2cfab',
            workspaceId = workspace_id)
        print(update_entity)

        state = update_entity['state']
        while state == 'UPDATING':
            entity_description = iottwinmaker_client.get_entity(entityId='WaterTank_ab5e8bc0-5c8f-44d8-b0a9-bef9c8d2cfab', workspaceId=workspace_id)
            state = entity_description['status']['state']
            print(f'  waiting for update to complete...current entity state: {state}')
            time.sleep(1)
    except Exception as e:
        if 'Component WaterTankVolume in entity WaterTank_ab5e8bc0-5c8f-44d8-b0a9-bef9c8d2cfab in workspace' in str(e):
            print("entity updated")
        else:
            raise e

if __name__ == '__main__':
    main()
