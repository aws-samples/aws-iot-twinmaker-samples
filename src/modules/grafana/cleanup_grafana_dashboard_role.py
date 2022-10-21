# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import argparse
import uuid
import boto3
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../libs'))
import deploy_utils

'''
This utility creates an IAM role with necessary permissions for the CookieFactory workspace in Grafana
'''

def parse_args():
    parser = argparse.ArgumentParser(
        description='Creates a role for the AWS IoT TwinMaker workspace for this CookieFactory sample to be used in Grafana.')
    parser.add_argument('--workspace-id',
                        help='workspace to be used on a Grafana dashboard',
                        required=True, default='CookieFactory')
    parser.add_argument('--region',
                        help="(optional) AWS region you are creating the sample in. Defaults to 'us-east-1'",
                        required=False, default='us-east-1')
    parser.add_argument('--profile',
                        help="(optional) AWS profile to access your account with. See your configured profiles with "
                             "`~/.aws/credentials`. Defaults to 'None'",
                        required=False, default=None)
    parser.add_argument('--endpoint-url', required=False, default=None, help='AWS IoT TwinMaker service endpoint')
    return parser.parse_args()


def main():
    args = parse_args()
    region = args.region
    profile = args.profile
    workspaceId = args.workspace_id

    session = boto3.session.Session(profile_name=profile)
    iam = session.client(service_name='iam', region_name=region)

    # fetch IAM role created for grafana from workspace tags
    ws = deploy_utils.WorkspaceUtils(
        workspace_id=workspaceId,
        region_name=region,
        endpoint_url=args.endpoint_url,
        profile=profile)
    dashboard_role_name_for_workspace = ws.fetch_sample_metadata("samples_content_dashboard_role_name")
    if dashboard_role_name_for_workspace is None:
        print(f"No dashboard role to delete was found for workspace {workspaceId}.")
        return
    
    # get role arn
    print(f"roleName: {dashboard_role_name_for_workspace}")
    try:
        dashboard_role_arn_for_workspace =iam.get_role(RoleName=dashboard_role_name_for_workspace)['Role']['Arn']
    except iam.exceptions.NoSuchEntityException:
        print(f"No dashboard role to delete was found for workspace {workspaceId}.")
        return
    print(f"roleArn: {dashboard_role_arn_for_workspace}")

    account_id = dashboard_role_arn_for_workspace.split(":")[4]
    iam_resource = boto3.resource('iam')
    role = iam_resource.Role(dashboard_role_name_for_workspace)
    for policy in role.attached_policies.all():
        policy_account_id = policy.arn.split(":")[4]
        if account_id == policy_account_id:
            role.detach_policy(PolicyArn=policy.arn)
            policy.delete()
            print(f"  detach+deleting managed policy: {policy.arn}")
        else:
            role.detach_policy(PolicyArn=policy.arn)
            print(f"  detach AWS-managed policy: {policy.arn}")

    for policy in role.policies.all():
        policy.delete()
        print(f"  delete inline role policy: {policy.name}")

    role.delete()
    print(f"Deleted role: {dashboard_role_name_for_workspace}")

if __name__ == '__main__':
    main()
