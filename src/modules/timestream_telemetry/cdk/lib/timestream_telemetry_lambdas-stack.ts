// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import { Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { aws_iam as iam } from 'aws-cdk-lib';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import { aws_timestream as timestream } from 'aws-cdk-lib';

export class TimestreamTelemetryCdkLambdasStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    /// TIMESTREAM UDQ INTEGRATION ///

    const timestreamUdqRole = new iam.Role(this, 'timestreamUdqRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    timestreamUdqRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, "lambdaExecRole","arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"))
    timestreamUdqRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonTimestreamReadOnlyAccess"))

    const timestreamDB = new timestream.CfnDatabase(this, "TimestreamTelemetry", {
      databaseName: `${this.stackName}`
    });
    if (timestreamDB.databaseName) {
      const timestreamTable = new timestream.CfnTable(this, "Telemetry", {
        tableName: `Telemetry`,
        databaseName: timestreamDB.databaseName, // create implicit CFN dependency
        retentionProperties: {
          memoryStoreRetentionPeriodInHours: (24*30).toString(10),
          magneticStoreRetentionPeriodInDays: (24*30).toString(10)
        }
      });
      timestreamTable.node.addDependency(timestreamDB);
      new CfnOutput(this, "TimestreamDatabaseName", { value: `${timestreamDB.databaseName}` });
      new CfnOutput(this, "TimestreamTableName", { value: `${timestreamTable.tableName}` });

      // udq reader lambda
      const timestreamReaderUDQ = new PythonFunction(this, 'timestreamReaderUDQ', {
        functionName: `iottwinmaker-${this.stackName}-tsDataReader`,
        entry: path.join(__dirname, '..', '..', 'lambda_function'),
        layers: [
          new PythonLayerVersion(this, 'udq_utils_layer', {
            entry: path.join(__dirname, '..', '..', '..', '..', 'libs', 'udq_helper_utils'),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
          }),
        ],
        handler: "lambda_handler",
        index: 'udq_data_reader.py',
        memorySize: 256,
        role: timestreamUdqRole,
        runtime: lambda.Runtime.PYTHON_3_10,
        timeout: Duration.minutes(15),
        logRetention: logs.RetentionDays.ONE_DAY,
        environment: {
          "TIMESTREAM_DATABASE_NAME": `${timestreamDB.databaseName}`,
          "TIMESTREAM_TABLE_NAME": `${timestreamTable.tableName}`,
        }
      });
      new CfnOutput(this, "TimestreamReaderUDQLambdaArn", { value: timestreamReaderUDQ.functionArn });
    }
  }
}
