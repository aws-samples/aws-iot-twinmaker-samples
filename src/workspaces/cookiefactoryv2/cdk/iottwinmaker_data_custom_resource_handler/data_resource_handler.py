# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import logging
import time
import boto3
import json

from botocore.config import Config

from VideoUtils import VideoUtils
import csv
import sys
import datetime
import os

# pip3 install -t . crhelper
from crhelper import CfnResource

logger = logging.getLogger(__name__)

session = boto3.session.Session()
session_config = Config(
    user_agent="cookiefactory_v2/1.0.0"
)
iottm = session.client(service_name='iottwinmaker', config=session_config)

cfnResource = CfnResource(json_logging=False, log_level='INFO', polling_interval=1)

STANDARD_RETRY_MAX_ATTEMPT_COUNT = 10
WAITER_ERROR_RETRY_MAX_ATTEMPT_COUNT = 2
WAIT_TIME_IN_MILLISECONDS = 3000


def handler(event, context):
    print(f"handler event: {event}")
    cfnResource(event, context)

def split_s3_path(s3_path):
    path_parts=s3_path.replace("s3://","").split("/")
    bucket=path_parts.pop(0)
    key="/".join(path_parts)
    return bucket, key


@cfnResource.create
def cfn_create_tmdt_data(event, context):
    print('create tmdt data')

    tmdt_config = json.loads(event['ResourceProperties']['tmdt.json'])
    asset_map = event['ResourceProperties']['asset_map']

    # 1. put the scenes and models into the workspace bucket
    workspace = iottm.get_workspace(workspaceId=event['ResourceProperties']['workspaceId'])
    workspace_bucket = workspace['s3Location'].split(":")[-1]
    s3 = boto3.resource('s3')
    for scene in tmdt_config['scenes']:
        print(f"handling custom scene file resource: {scene} ...")
        if scene in asset_map:
            asset_s3_url = asset_map[scene]
            asset_bucket, asset_key = split_s3_path(asset_s3_url)

            if '/' in scene:
                sceneFileName = scene.split('/')[-1]
            else:
                sceneFileName = scene

            local_file_name = '/tmp/'+asset_key.split('/')[-1]
            print(f"downloading s3://{asset_bucket}/{asset_key} to /tmp/")
            s3.Bucket(asset_bucket).download_file(asset_key, local_file_name)
            print("s3 download done")

            with open(local_file_name, 'r') as scene_file:
                # update scene model references
                scene_file_json = json.loads(scene_file.read())
                for node in scene_file_json['nodes']:
                    for component in node['components']:
                        if component['type'] == 'ModelRef':
                            if not component['uri'].startswith("s3://"):
                                print(f"  replacing modelref: {component['uri']} -> s3://{workspace_bucket}/{component['uri']}")
                                component['uri'] = f"s3://{workspace_bucket}/{component['uri']}"
                sceneContentWithUpdatedUriRefs = json.dumps(scene_file_json, indent=4)
                object = s3.Object(workspace_bucket, sceneFileName)
                result = object.put(Body=sceneContentWithUpdatedUriRefs)
                print(f"  uploaded scene resource: s3://{workspace_bucket}/{sceneFileName}, result={result}")

            os.remove(local_file_name)

    for model in tmdt_config['models']:
        if model in asset_map:

            if '/' in model:
                modelFileName = model.split('/')[-1]
            else:
                modelFileName = model

            asset_s3_url = asset_map[model]
            asset_bucket, asset_key = split_s3_path(asset_s3_url)
            print(f"copying model file {model} (s3://{asset_bucket}/{asset_key}) -> s3://{workspace_bucket}/{modelFileName}")
            s3.meta.client.copy(
                {
                    'Bucket': asset_bucket,
                    'Key': asset_key
                },
                workspace_bucket, modelFileName)

    # 2. ingest data
    # KVS data
    region = os.environ['AWS_REGION']
    video_utils = VideoUtils(region, profile=None)

    for data in tmdt_config['data']:
        print(f"ingest: {data}")
        if data['source'] in asset_map:
            if data['type'] == 'video' and data['destination']['type'] == 'kvs':
                asset_s3_url = asset_map[data['source']]
                kvs_stream_name = data['destination']['kvs_stream_name']
                asset_bucket, asset_key = split_s3_path(asset_s3_url)

                local_file_name = '/tmp/'+asset_key.split('/')[-1]
                print(f"downloading s3://{asset_bucket}/{asset_key} to /tmp/")
                s3.Bucket(asset_bucket).download_file(asset_key, local_file_name)
                print("s3 download done")

                try:
                    start_time_offset_in_seconds = data['destination']['configuration']['start_time_offset_in_seconds']
                except:
                    start_time_offset_in_seconds = 0

                adjusted_start_time = datetime.datetime.now() + datetime.timedelta(seconds = start_time_offset_in_seconds)
                time_stamp_in_seconds = int(round(adjusted_start_time.timestamp()))

                print(f"start_timestamp: {adjusted_start_time}, kvs_stream_name={kvs_stream_name}")
                video_utils.upload_video(file_name=local_file_name, stream_name=kvs_stream_name, start_tmstp=str(time_stamp_in_seconds))
                print(f"video upload done for {data['source']} -> {kvs_stream_name}")
                os.remove(local_file_name)
            elif data['type'] == 'timestream-timeseries' and data['destination']['type'] == 'timestream':
                timestream = session.client(
                    service_name='timestream-write',
                    config=Config(read_timeout=20, max_pool_connections=5000, retries={'max_attempts': 10})
                )

                asset_s3_url = asset_map[data['source']]
                timestream_db = data['destination']['database']
                timestream_table = data['destination']['table'] # "Telemetry"
                asset_bucket, asset_key = split_s3_path(asset_s3_url)

                local_file_name = '/tmp/'+asset_key.split('/')[-1]
                print(f"downloading s3://{asset_bucket}/{asset_key} to /tmp/")
                s3.Bucket(asset_bucket).download_file(asset_key, local_file_name)
                print("s3 download done")

                filepath = local_file_name
                rebase_time_ms=int(round(time.time() * 1000))

                def _submit_batch(records, counter):
                    try:
                        result = timestream.write_records(DatabaseName=timestream_db, TableName=timestream_table,
                                                               Records=records, CommonAttributes={})
                        print("   Processed [%d] records. WriteRecords Status: [%s]" % (counter,
                                                                                        result['ResponseMetadata']['HTTPStatusCode']))
                    except Exception as err:
                        print("   Error:", err)


                with open(filepath, 'r') as csv_file:
                    # creating a csv reader object
                    csv_reader = csv.reader(csv_file)

                    records = []
                    counter = 0
                    first_record_time = 0
                    earliest_record_time = sys.maxsize
                    latest_record_time = 0

                    # extracting each data row one by one
                    # row[0]            row[1]              row[2]             row[3]         row[4]       row[5]
                    # Time,             TelemetryAssetType, TelemetryAssetId,  PropertyId,    Value,       Type
                    # 1633415395173,    Alarm,              Mixer_7_...,       Status,        Normal,      VARCHAR
                    # 1633415395173,    Mixer,              Mixer_7_...,       RPM,           100,         DOUBLE

                    for row in csv_reader:
                        dimensions = [
                            {'Name': 'TelemetryAssetType', 'Value': row[1]},
                            {'Name': 'TelemetryAssetId', 'Value': row[2]},
                        ]

                        if (first_record_time == 0):
                            first_record_time = int(row[0])

                        if (rebase_time_ms is not None):
                            record_time = rebase_time_ms + int(row[0]) - first_record_time
                        else:
                            record_time = int(row[0])

                        earliest_record_time = min(record_time, earliest_record_time)
                        latest_record_time = max(record_time, latest_record_time)

                        record = {
                            'Dimensions': dimensions,
                            'MeasureName': row[3],
                            'MeasureValue': row[4],
                            'MeasureValueType': row[5],
                            'Time': str(record_time)
                        }

                        records.append(record)
                        counter = counter + 1

                        if len(records) == 100:
                            _submit_batch(records, counter)
                            records = []

                    if len(records) != 0:
                        _submit_batch(records, counter)

                    print(f"   Ingested {counter} records from "
                          f"{datetime.datetime.fromtimestamp(earliest_record_time/1000.0, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')} - "
                          f"{datetime.datetime.fromtimestamp(latest_record_time/1000.0, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')}")
                os.remove(local_file_name)
            else:
                assert False, f"Unknown Data to Ingest: {data}"

    print(event)

@cfnResource.update
def no_op(_, __):
    pass

@cfnResource.delete
def cfn_delete_tmdt_data(event, context):
    logger.info('retaining data resources... ignoring deletion request')
    logger.info(event)
    pass
