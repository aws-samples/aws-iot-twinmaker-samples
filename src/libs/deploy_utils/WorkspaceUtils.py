# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import boto3
import time
import json

import botocore


class WorkspaceUtils:
    def __init__(self, workspace_id, endpoint_url, region_name, profile=None):
        self.session = boto3.session.Session(profile_name=profile)
        self.iottwinmaker_client = self.session.client(service_name='iottwinmaker', endpoint_url=endpoint_url, region_name=region_name)
        self.workspace_id = workspace_id
        ws = self.iottwinmaker_client.get_workspace(workspaceId = self.workspace_id)
        self.ws = ws
        self.role = ws.get('role')
        self.s3BucketArn = ws.get('s3Location')
        self.s3BucketUri = self.s3BucketArn.replace('arn:aws:s3:::', 's3://')
        self.s3BucketName = self.s3BucketArn.rpartition(":")[2]
        self.s3 = self.session.client(service_name='s3', region_name=region_name)
        self.account_id = self.session.client("sts").get_caller_identity()["Account"]

    def recursive_delete_child_entites(self, entity_id):
        # first we do a depth first recursive delete to get down to the leaf nodes
        while True:
            next_token = ''
            resp = self.iottwinmaker_client.list_entities(workspaceId=self.workspace_id, filters=[{'parentEntityId': entity_id}], maxResults=200, nextToken=next_token)
            for i, entity in enumerate(resp['entitySummaries']):
                self.recursive_delete_child_entites(entity_id=entity['entityId'])
            nextToken = resp.get('nextToken', None)
            if nextToken == None:
                break

        # at this point we have called recursive delete on all of children and will wait for our immediate children to finish deleting
        resp = self.iottwinmaker_client.list_entities(workspaceId=self.workspace_id, filters=[{'parentEntityId': entity_id}])
        while len(resp['entitySummaries']) > 0:
            print(f"      waiting for children of {entity_id} to finish deleting. ({len(resp['entitySummaries'])} remaining)")
            time.sleep(1)
            resp = self.iottwinmaker_client.list_entities(workspaceId=self.workspace_id, filters=[{'parentEntityId': entity_id}])

        # children are now deleted so delete self
        if entity_id!='$ROOT':
            print(f"   deleting entity: {entity_id}")
            try:
                resp = self.iottwinmaker_client.delete_entity(workspaceId=self.workspace_id, entityId=entity_id, isRecursive=True)
            except Exception as e:
                print(f"   failed to delete entity: {entity_id}")

    def delete_all_entities(self):
        self.recursive_delete_child_entites(entity_id='$ROOT')

    def recursive_delete_component_type(self, decendants_map, component_type_id):
        if component_type_id in decendants_map:
            decendants = decendants_map[component_type_id]
            for i, decendant in enumerate(decendants):
                self.recursive_delete_component_type(decendants_map, decendant)
            decendants_map.pop(component_type_id)
            print(f"   deleting component type: {component_type_id}")
            try:
                self.iottwinmaker_client.delete_component_type(workspaceId=self.workspace_id, componentTypeId=component_type_id)
            except Exception as e:
                print(f"   skipping component type: {component_type_id}")

    def delete_all_component_types(self):
        resp = self.iottwinmaker_client.list_component_types(workspaceId=self.workspace_id)
        component_type_summaries = resp['componentTypeSummaries']

        details_map = {} # details of each component type indexed by component_id
        decendants_map = {} # list of ancestors of each component type indexed by component_id
        # for each component initialize the ancestor map
        for i, cts in enumerate(component_type_summaries):
            decendants_map[cts['componentTypeId']] = []

        # for each component lookup the details and populate the ancestor map
        for i, cts in enumerate(component_type_summaries):
            component_type_id = cts['componentTypeId']
            component_type = self.iottwinmaker_client.get_component_type(workspaceId=self.workspace_id, componentTypeId=component_type_id)
            details_map[component_type_id] = component_type
            if 'extendsFrom' in component_type:
                # for each of the base types this type extends... add it to the ancestor map
                for i, base_component_type_id in enumerate(component_type['extendsFrom']):
                    decendants_map[base_component_type_id].append(component_type_id)

        # remove all component type by looping over the map
        while len(decendants_map) > 0:
            # get the next component_id found in the decendants map and delete its chain of decendants
            component_type_id = next(iter(decendants_map.items()))[0]
            self.recursive_delete_component_type(decendants_map=decendants_map, component_type_id=component_type_id)

    def delete_all_scenes(self):
        # todo: actually delete S3 files rather than just association
        resp = self.iottwinmaker_client.list_scenes(workspaceId=self.workspace_id)
        for i, scene in enumerate(resp['sceneSummaries']):
            resp = self.iottwinmaker_client.delete_scene(workspaceId=self.workspace_id, sceneId=scene['sceneId'])

    def delete_resource(self, destination):
        print(f"  deleting resource: s3://{self.s3BucketName}/{destination}")
        self.s3.delete_object(Bucket=self.s3BucketName, Key=destination)

    def delete_all_content(self):
        try:
            self.iottwinmaker_client.get_workspace(workspaceId=self.workspace_id)
        except self.iottwinmaker_client.exceptions.ResourceNotFoundException as e:
            return
        self.delete_all_entities()
        self.delete_all_component_types()
        self.delete_all_scenes()

    def delete_workspace_role_and_bucket(self):
        workspace = self.iottwinmaker_client.get_workspace(workspaceId=self.workspace_id)
        ws_s3_bucket = workspace['s3Location'].split(":")[-1]
        ws_s3_bucket_logs = ws_s3_bucket + "-logs"
        ws_role = workspace['role'].split('/')[-1]

        account_id = workspace['role'].split(":")[4]

        print(f"  ensuring all workspace content deleted...")
        self.delete_workspace()
        print(f"  workspace {self.workspace_id} deleted...")

        print(f"  deleting workspace role and s3 buckets: ({ws_role}, {ws_s3_bucket})")

        iam = boto3.resource('iam')
        role = iam.Role(ws_role)
        for policy in role.attached_policies.all():
            policy_account_id = policy.arn.split(":")[4]
            if account_id == policy_account_id:
                role.detach_policy(PolicyArn=policy.arn)
                policy.delete()
                print(f"    detach+deleting managed policy: {policy.arn}")
            else:
                role.detach_policy(PolicyArn=policy.arn)
                print(f"    detach AWS-managed policy: {policy.arn}")

        for policy in role.policies.all():
            policy.delete()
            print(f"    delete inline role policy: {policy.name}")

        role.delete()
        print(f"    deleted role: {ws_role}")

        s3 = self.session.resource('s3')

        try:
            # delete from data bucket
            bucket = s3.Bucket(ws_s3_bucket)
            bucket.object_versions.delete()
            bucket.delete()
            print(f"  bucket emptied + deleted: {ws_s3_bucket}")
        except botocore.exceptions.ClientError as e:
            if "NoSuchBucket" in str(e):
                print(f"  bucket not found: {ws_s3_bucket}")
            else:
                raise e
        try:
            # delete from logs bucket (might not exist)
            bucket = s3.Bucket(ws_s3_bucket_logs)
            bucket.object_versions.delete()
            bucket.delete()
            print(f"  bucket emptied + deleted: {ws_s3_bucket_logs}")
        except botocore.exceptions.ClientError as e:
            if "NoSuchBucket" in str(e):
                pass
            else:
                print(e)
                print(f"! Failed to delete logs bucket: {ws_s3_bucket_logs}, please manually delete in console at:\n    https://s3.console.aws.amazon.com/s3/bucket/{ws_s3_bucket_logs}-logs/empty?region=us-east-1")

    def delete_workspace(self):
        self.delete_all_content()
        self.iottwinmaker_client.delete_workspace(workspaceId=self.workspace_id)

    def import_component_type(self, filename, lambdaArn=None):
        f = open(filename)
        filedata = f.read()
        if lambdaArn is not None:  # patch up lambda arn
            filedata = filedata.replace('{lambdaArn}', lambdaArn)
        # lambda arn might have an accountId placeholder in it
        filedata = filedata.replace('{accountId}', self.account_id)
        input = json.loads(filedata)
        print(f"   importing component type: {input.get('componentTypeId')}")
        input['workspaceId'] = self.workspace_id
        self.iottwinmaker_client.create_component_type(**input)

    def import_entities(self, filename):
        f = open(filename)
        data = json.load(f)
        for entity in data["entities"]:
            print(f'   importing entity: {entity["entityPath"]}')
            self.iottwinmaker_client.create_entity(workspaceId=self.workspace_id,
                                                   entityId=entity["entityId"],
                                                   parentEntityId=entity["parentEntityId"],
                                                   entityName=entity["entityName"],
                                                   components=entity["components"])

    def update_entity(self, entityId, componentUpdates):
        state_transition_error = "Cannot update Entity when it is in CREATING state"

        def entity_in_state_transition(error_message):
            if "Cannot update Entity" in error_message:
                if "when it is in CREATING state" in error_message:
                    return True
                elif "when it is in UPDATING state" in error_message:
                    return True
            return False
        print(f"   updating entity: {entityId}")
        while entity_in_state_transition(state_transition_error):
            try:
                self.iottwinmaker_client.update_entity(
                    componentUpdates=componentUpdates,
                    entityId=entityId,
                    workspaceId=self.workspace_id
                )
            except Exception as e:
                state_transition_error = str(e)
                if "cannot be created as it already exists" in state_transition_error:
                    pass
                elif entity_in_state_transition(state_transition_error):
                    print(f"      waiting for entity {entityId} to finish transition state before updating again: {state_transition_error}")
                    time.sleep(10)
                else:
                    raise e
        print(f"   updated entity: {entityId}")

    def import_scene(self, file_name, scene_name):
        try:
            resp = self.iottwinmaker_client.create_scene(workspaceId=self.workspace_id, sceneId=scene_name, contentLocation=f"{self.s3BucketUri}/{scene_name}.json")
        except Exception as e:
            print(   f"Scene already exists.. updating content.")
        self.s3.upload_file(file_name, self.s3BucketName, f"{scene_name}.json")

    def import_resource(self, file_name, destination):
        self.s3.upload_file(file_name, self.s3BucketName, destination)
        print(f"  uploaded resource: s3://{self.s3BucketName}/{destination}")

    # to make samples re-runnable, we may store some metadata in the tags of the workspace
    def fetch_sample_metadata(self, key):
        workspace_arn = self.ws['arn']
        res = self.iottwinmaker_client.list_tags_for_resource(resourceARN=workspace_arn)
        return res['tags'].get(key)
    def store_sample_metadata(self, key: str, value: str):
        workspace_arn = self.ws['arn']
        self.iottwinmaker_client.tag_resource(resourceARN=workspace_arn, tags={key: value})
        return
