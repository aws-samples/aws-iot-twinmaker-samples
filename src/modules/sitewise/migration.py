#!/usr/bin/env python

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

from exporter import *
from importer import *

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


def main():
    parser = parse_arguments()
    args = parser.parse_args()

    print("Exporting assets and models from SiteWise...")
    o = export_iottwinmaker({'bucket':args.bucket,
            'prefix':args.prefix,
            'entity_prefix': args.entity_name_prefix,
            'workspace_id': args.workspace_id,
            'iottwinmaker_role_arn': args.iottwinmaker_role_arn},None)

    c_key = o.get('body').get('componentPath')
    e_key = o.get('body').get('entityPath')

    print("Importing assets and models to IoT TwinMaker...")
    i = import_handler( {'body':{
            'workspaceId':args.workspace_id,
            'exportedDataBucket':args.bucket,
            'componentPath':c_key,
            'entityPath':e_key,
            'iottwinmakerRoleArn' : args.iottwinmaker_role_arn}}, None)
main()
