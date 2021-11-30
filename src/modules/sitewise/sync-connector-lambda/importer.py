#!/usr/bin/env python

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import argparse
import csv
import json
import os

from library import * ## Common entity construction methods.

'''
Use the exported asset models and assets information to construct iottwinmaker components and entities.
The asset models map to components and assets map to entities, roughly.
input:
    -b  --bucket                    The bucket containing exported sitewise models
    -c  --component-key             The path to JSON file in s3 containing exported sitewise models
    -e  --entity-key                The path to JSON file in s3 containing exported sitewise assets
    -w  --workspace-id              Workspace id that will be created.
    -r  --iottwinmaker-role-arn     The ARN of the role which will be assumed by iottwinmaker

output:
    None on console, creates entities in iottwinmaker workspace
'''

SERVICE_ENDPOINT= os.environ.get('AWS_ENDPOINT')
load_env()
s3 = boto3_session().client('s3')
iottwinmaker_client = boto3_session().client('iottwinmaker', endpoint_url = SERVICE_ENDPOINT)

## -f as the input iottwinmaker json file
def parse_arguments():
  parser = argparse.ArgumentParser(
                  description='Load JSON entities into iottwinmaker')
  parser.add_argument('-b', '--bucket',
                        help='The bucket containing exported sitewise models',
                        required=True)
  parser.add_argument('-c', '--component-key',
                        help='The path to JSON file in s3 containing exported sitewise models',
                        required=True)
  parser.add_argument('-e', '--entity-key',
                        help='The path to JSON file in s3 containing exported sitewise assets',
                        required=True)
  parser.add_argument('-w', '--workspace-id',
                        help='The workspace id to create components and entities in',
                        required=True)
  parser.add_argument('-r', '--iottwinmaker-role-arn',
                        help='ARN of the role assumed by Iottwinmaker',
                        default=False,
                        required=False)
  return parser


## Create the components structure for create or update api call
def update_create_component( create, workspace_id, component ):
    if create:
        resp = iottwinmaker_client.create_component_type(
            workspaceId = workspace_id,
            description = "imported from sitewise",
            extendsFrom = [ "com.amazon.iotsitewise.connector" ],
            componentTypeId = component.get("componentTypeId"),
            propertyDefinitions = component.get("properties")
        )
        api_report(resp)
        wait_over(iottwinmaker_client.get_component_type,
                {"componentTypeId":component.get("componentTypeId"), "workspaceId":workspace_id},
                'status.state', 'ACTIVE')
    else:
        log("Component exists. skipping.")


## update component from asset models if it exists in iottwinmaker, else create in iottwinmaker.
def create_properties_component(workspace_id, components):
    x_components = all_results(iottwinmaker_client.list_component_types,
                        {"workspaceId": workspace_id},
                        "componentTypeSummaries")

    for component in components:
        update = False
        for x_component in x_components:
            if component.get("componentTypeId") == x_component.get("componentTypeId"):
                update_create_component(False, workspace_id, component)
                update = True
                break
        if not update:
            update_create_component(True, workspace_id, component)

## Create a workspace if one does not already exist
def create_workspace(workspace_id, iottwinmaker_role_arn):
    ws = all_results(iottwinmaker_client.list_workspaces, {}, "workspaceSummaries")
    for w in ws:
        if workspace_id == w.get("workspaceId"):
            return
    bucket_name = "iottwinmaker-" + workspace_id
    s3.create_bucket(Bucket=bucket_name)
    bucket_created = s3.get_waiter('bucket_exists')
    bucket_created.wait(Bucket=bucket_name)

    iot_role = iottwinmaker_role_arn #if iottwinmaker_role_arn else get_role_from_identity()
    resp = iottwinmaker_client.create_workspace(
            workspaceId = workspace_id,
            s3Location = 'arn:aws:s3:::' + bucket_name,
            role = iot_role
    )
    api_report(resp)

def create_iottwinmaker_components(workspace_id, j_data, iottwinmaker_role_arn):
    create_workspace(workspace_id, iottwinmaker_role_arn)
    create_properties_component(workspace_id, j_data)


## Create the component structure and then use that to create/update a iottwinmaker entity
def create_update_entity(create, workspace_id, entity):
    if entity.get("entity_id") == '$ROOT': return
    if create:
        component_properties_key = "properties"
    else:
        component_properties_key = "propertyUpdates"
    component = {   "sitewiseData": {
                        "componentTypeId": entity.get("component_id"),
                        component_properties_key : {
                            "sitewiseAssetId": {
                                "value": { "stringValue": entity.get("asset_id") }
                            }
                    } } }

    entity_prop = { "entityId" : entity.get("entity_id"),
                "entityName" : entity.get("entity_name"),
                "workspaceId" : workspace_id,
                "description" : "Imported from SiteWise:" + str(entity.get("description"))}

    if create:
        if entity.get("parent_id") is not None and entity.get("parent_id") != '$ROOT':
            entity_prop["parentEntityId"] = entity.get("parent_id")
        resp = iottwinmaker_client.create_entity(
                **entity_prop,
                components = component
            )
    else:
        if entity.get("parent_id") is not None and entity.get("parent_id") != '$ROOT':
            entity_prop["parentEntityUpdate"] = {
                    "updateType" : "UPDATE",
                    "parentEntityId": entity.get("parent_id")}
        resp = iottwinmaker_client.update_entity(
                **entity_prop,
                componentUpdates = component
            )
    ## Ensure that the entity is created/updated and in active status
    ## before proceeding, as this entity may be a parent to some child.
    api_report(resp)
    #entity_created_id = resp.get('entityId')
    wait_over(iottwinmaker_client.get_entity,
                {"entityId":entity.get('entity_id'),
                #{"entityId":entity_created_id,
                    "workspaceId":workspace_id},
                'status.state', 'ACTIVE')
    return resp


## Create a iottwinmaker entity if it does not exists, else update it if an active entity is found
def create_iottwinmaker_entities(workspace_id, j_data):
    x_entities = all_results(iottwinmaker_client.list_entities,
                        {"workspaceId": workspace_id},
                        "entitySummaries")

    for entity in j_data.get('entities'):
        entity_id = entity.get('entity_id')
        found = False
        active = False
        for x_entity in x_entities:
            if x_entity.get("entityId") == entity_id:
                found = True
                status = x_entity.get("status")
                if status:
                    if 'ACTIVE' == status.get("state"):
                        active = True
                break

        if not found:
            resp = create_update_entity( True, workspace_id, entity)
        elif active:
            resp = create_update_entity( False, workspace_id, entity)
        else:   ## Found but not active
            log(entity_id + " is not in active state to update")
        


## Generic function to get json data from S3 object
def get_json_content(json_bucket, json_file):
    obj_content = s3.get_object(Bucket = json_bucket, Key = json_file)
    file_content = obj_content.get('Body').read().decode('utf-8')
    json_content = json.loads(file_content)
    return json_content

    
## Entry point for Lambda handler
def import_handler(event, context):
    input = event.get('body')
    workspace_id = input.get('workspaceId')
    iottwinmaker_role_arn = input.get("iottwinmakerRoleArn")

    json_bucket = input.get("exportedDataBucket")
    json_file = input.get("componentPath")
    json_content = get_json_content(json_bucket, json_file)
    create_iottwinmaker_components(workspace_id, json_content, iottwinmaker_role_arn)

    json_bucket = input.get("exportedDataBucket")
    json_file = input.get("entityPath")
    json_content = get_json_content(json_bucket, json_file)
    create_iottwinmaker_entities(workspace_id, json_content)

def main():
    if __name__ != '__main__':
        return
    parser = parse_arguments()
    args = parser.parse_args()
    

    import_handler( {'body':{
            'workspaceId':args.workspace_id,
            'exportedDataBucket':args.bucket,
            'componentPath':args.component_key,
            'entityPath':args.entity_key,
            'iottwinmakerRoleArn' : args.iottwinmaker_role_arn}}, None)

main()
