# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import boto3
import logging
import time
import uuid
import json
import csv
import argparse
import os
import sys

LOGGER = logging.getLogger()
LOGGER.setLevel(logging.INFO)

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../modules'))
from sitewise.lib.util.SiteWiseTelemetryUtils import SiteWiseTelemetryImporter

def parse_arguments():
  parser = argparse.ArgumentParser(
                  description='Load telemetry data into IotSiteWise')
  subparser = parser.add_subparsers(dest='command')

  import_parser = subparser.add_parser('import')
  cleanup_parser = subparser.add_parser('cleanup')

  import_parser.add_argument('--csv-file',
                        help='The csv file name',
                        required=True)

  import_parser.add_argument('--aws-region',
                        help='The aws region to store data in iotsitewise',
                        required=False)

  import_parser.add_argument('--asset-model-name-prefix',
                        help='Prefix of asset model name',
                        required=True)

  import_parser.add_argument('--entity-include-pattern',
                             help='Only import entities whose name/id include this string',
                             required=False,
                             default=None)

  cleanup_parser.add_argument('--aws-region',
                        help='The aws region to store data in iotsitewise',
                        required=False)

  cleanup_parser.add_argument('--asset-model-name-prefix',
                        help='Prefix of asset mode name',
                        required=True)
  cleanup_parser.add_argument('--entity-include-pattern',
                             help='Only cleanup entities whose name/id include this string',
                             required=False,
                             default=None)
  return parser

def print_usage():
    print("""Usage: 
    Install lib to local first by:
    goto folder of $GETTING_STARTED_DIR/src/modules/sitewise/lib
    pip install .

    then in folder $GETTING_STARTED_DIR/src/libs/deploy_utils 

    To import csv file to iot sitewise,
       `python3 SiteWiseTelemetry.py import --csv-file ../../../workspaces/cookiefactory/sample_data/telemetry/telemetry.csv --asset-model-name-prefix CookieFactory` 

    To cleanup above dataset from sitewise,
       `python3 SiteWiseTelemetry.py cleanup --asset-model-name-prefix CookieFactory`  
    """)


def main():

    parser = parse_arguments()
    args = parser.parse_args()


    assetModelPrefix = args.asset_model_name_prefix
    print(args)
    entityIncludePattern = args.entity_include_pattern

    sitewiseImporter = SiteWiseTelemetryImporter(args.aws_region, asset_model_prefix=assetModelPrefix, entity_include_pattern=entityIncludePattern)

    if args.command == 'import':
        csvFile = args.csv_file
        sitewiseImporter.import_csv_to_sitewise(csvFile)
    elif args.command == 'cleanup':
        sitewiseImporter.cleanup_sitewise(assetModelPrefix)
    else: 
        print_usage()

if __name__ == '__main__':
    main()