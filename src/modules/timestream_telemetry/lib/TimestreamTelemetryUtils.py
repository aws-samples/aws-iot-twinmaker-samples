# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
# SPDX-License-Identifier: Apache-2.0

import csv
import boto3
import datetime
import sys
import time
from botocore.config import Config


class TimestreamTelemetryImporter:
    def __init__(self, region_name, database_name, table_name, stack_name=None, profile=None):
        session = boto3.session.Session(profile_name=profile)
        self.timestream = session.client('timestream-write', region_name=region_name, config=Config(read_timeout=20, max_pool_connections=5000, retries={'max_attempts': 10}))
        self.database_name = database_name
        self.table_name = table_name
        self.lambda_arn = 'arn:aws:lambda:us-east-1:{accountId}:function:timestream-telemetry-reader'

        if stack_name is not None:
            cfn_client = session.client(service_name='cloudformation', region_name=region_name)
            cfn_stack_description = cfn_client.describe_stacks(StackName=stack_name)
            cfn_stack_outputs = {x['OutputKey']:x['OutputValue'] for x in cfn_stack_description['Stacks'][0]['Outputs']}
            self.database_name = cfn_stack_outputs.get('TimestreamDatabaseName')
            self.table_name = cfn_stack_outputs.get('TimestreamTableName')
            self.lambda_arn = cfn_stack_outputs.get('TimestreamReaderUDQLambdaArn')

    # Create the timestream database if needed and recreate the Telemetry table
    def recreate_table(self):
        print('Recreating the timestream database and table for telemetry')
        try:
            result = self.timestream.create_database(DatabaseName=self.database_name)
        except self.timestream.exceptions.ConflictException as e:
            print('   Database already exists')

        try:
            result = self.timestream.delete_table(DatabaseName=self.database_name, TableName=self.table_name)
        except self.timestream.exceptions.ResourceNotFoundException as e:
            print('  Table didn\'t exsist... creating new')

        result = self.timestream.create_table(DatabaseName=self.database_name, TableName=self.table_name,
                    RetentionProperties={'MemoryStoreRetentionPeriodInHours': 24*30, 'MagneticStoreRetentionPeriodInDays': 180})

    def import_csv(self, filepath, rebase_time_ms=None):
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
                    self._submit_batch(records, counter)
                    records = []

            if len(records) != 0:
                self._submit_batch(records, counter)

            print(f"   Ingested {counter} records from "
                  f"{datetime.datetime.fromtimestamp(earliest_record_time/1000.0, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')} - "
                  f"{datetime.datetime.fromtimestamp(latest_record_time/1000.0, datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S %Z')}")

    def _submit_batch(self, records, counter):
        try:
            result = self.timestream.write_records(DatabaseName=self.database_name, TableName=self.table_name,
                                               Records=records, CommonAttributes={})
            print("   Processed [%d] records. WriteRecords Status: [%s]" % (counter,
                                                                         result['ResponseMetadata']['HTTPStatusCode']))
        except Exception as err:
            print("   Error:", err)

    @staticmethod
    def _current_milli_time():
        return int(round(time.time() * 1000))

