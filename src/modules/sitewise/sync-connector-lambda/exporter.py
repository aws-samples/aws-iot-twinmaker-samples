#!/usr/bin/env python

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import argparse
import csv
import json
import os
import time

from library import * ## Common entity construction methods.

'''
- Call Iot SiteWise API to export all asset models
- Call Iot SiteWise API to export all assets
- Map asset models to components, model properties to components properties
- Map asset ids to entities.
- Map model hierarchites to entity parent child relationship
    -b  --bucket                The bucket to exported sitewise artifacts to.
    -p  --prefix                The prefix under which assets and models will be exported to.
    -r  --iottwinmaker-role-arn     ARN of the role assumed by Iottwinmaker
    -w  --workspace-id          Workspace id passed to import, optional for export
    -n  --entity-name-prefix    Prefix to namespace entities
'''

sw = boto3_session().client('iotsitewise')

## -f as the input CSV
def parse_arguments():
  parser = argparse.ArgumentParser(
                  description='export SiteWise model and assets to Iottwinmaker')
  parser.add_argument('-b', '--bucket',
                        help='S3 bucket to store the exported files to.',
                        required=True)
  parser.add_argument('-p', '--prefix',
                        help='prefix path within the S3 bucket',
                        required=True)
  parser.add_argument('-r', '--iottwinmaker-role-arn',
                        help='ARN of the role assumed by Iottwinmaker',
                        default=False,
                        required=True)
  parser.add_argument('-w', '--workspace-id',
                        help='Workspace id passed to import, optional for export',
                        required=False)
  parser.add_argument('-n', '--entity-name-prefix',
                        help='prefix to namespace entity to avoid clash',
                        required=True)
  return parser

def extract_components():
    models = all_results(sw.list_asset_models,{}, "assetModelSummaries")
    components = list()
    for model in models:
        component = {
                "componentTypeId": "com.sitewise.user." + underscored(model.get("name")),
                "properties": {
                        "sitewiseAssetModelId": {
                            "defaultValue": { "stringValue" : model.get("id")}
                        }
                    }
                }
        components.append(component)
    return models, components


def extract_entity(asset, model_name, parent_id, prefix):
    entity = {  'entity_id': prefix + underscored(asset.get("name")),
                'entity_name': prefix + underscored(asset.get("name")),
                'description': asset.get("description"),
                'asset_id' : asset.get("id"),
                'component_id' : 'com.sitewise.user.' + underscored(model_name) }
    if parent_id is not None:
        #entity['parent_id'] = parent_id if parent_id == '$ROOT' else underscored(parent_id)
        entity['parent_id'] = prefix + underscored(parent_id)

    return entity


def siblings(model_name, asset, collect, parent_id, prefix):
    collect.append(extract_entity(asset, model_name, parent_id, prefix))
    hierarchies = asset.get("hierarchies")
    for hierarchy in hierarchies:
        hierarchy_id = hierarchy.get("id")
        assets = all_results(sw.list_associated_assets,
                    {"assetId": asset.get("id"),
                    "hierarchyId": hierarchy_id,
                    "traversalDirection":"CHILD"}, "assetSummaries")
       
        parent_id = asset.get("name")
        for child in assets:
            asset_model = sw.describe_asset_model(assetModelId = child.get('assetModelId'))
            collect = siblings(asset_model.get('assetModelName'), child, collect, parent_id, prefix)
    return collect
        

def export_iottwinmaker(event, context):
    load_env()
    SERVICE_ENDPOINT= os.environ.get('AWS_ENDPOINT')
    iottwinmaker = boto3_session(). \
                client('iottwinmaker', endpoint_url = SERVICE_ENDPOINT)
    ws_bucket = event.get("bucket")
    ws_prefix = event.get("prefix")
    entity_prefix = event.get("entity_prefix")
    iottwinmaker_role_arn = event.get("iottwinmaker_role_arn")
    ts = time.time()
    component_export = '{}/components/{}.json'.format(ws_prefix,ts)
    entity_export = '{}/entities/{}.json'.format(ws_prefix,ts)

    models, components = extract_components()
    s3_save(ws_bucket, component_export, components)

    collect = []
    for model in models:
        assets = all_results(sw.list_assets,
                {"assetModelId":model.get('id'), "filter":"TOP_LEVEL"},
                            "assetSummaries")
        for asset in assets:
            collect = siblings(model.get('name'), asset, collect, None, entity_prefix)
    
    workspace_id = event.get('workspace_id')
    entities = {"workspace_id":workspace_id, "entities":collect}
    s3_save(ws_bucket, entity_export, entities)

    ret_val = {
            "body":{
                    "workspaceId": workspace_id,
                    "exportedDataBucket":ws_bucket,
                    "componentPath": component_export,
                    "entityPath":entity_export,
                    "iottwinmakerRoleArn": iottwinmaker_role_arn
                }
            }

    log(json.dumps(ret_val))

    return ret_val
    

def main():
    if __name__ != '__main__':
        return
    parser = parse_arguments()
    args = parser.parse_args()

    r = export_iottwinmaker({'bucket':args.bucket,
                'prefix':args.prefix,
                'entity_prefix': args.entity_name_prefix,
                'workspace_id': args.workspace_id,
                'iottwinmaker_role_arn': args.iottwinmaker_role_arn},None)
    print(r)

main()
