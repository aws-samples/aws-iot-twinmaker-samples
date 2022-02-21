// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import * as cdk from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdapython from "@aws-cdk/aws-lambda-python";
import * as path from 'path';
import * as timestream from "@aws-cdk/aws-timestream";
import * as iam from "@aws-cdk/aws-iam";

export class TimestreamTelemetryCdkLambdasStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
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
      new cdk.CfnOutput(this, "TimestreamDatabaseName", { value: `${timestreamDB.databaseName}` });
      new cdk.CfnOutput(this, "TimestreamTableName", { value: `${timestreamTable.tableName}` });

      // udq reader lambda
      const timestreamReaderUDQ = new lambdapython.PythonFunction(this, 'timestreamReaderUDQ', {
        entry: path.join(__dirname, '..', '..', 'lambda_function'),
        layers: [
          new lambdapython.PythonLayerVersion(this, 'udq_utils_layer', {
            entry: path.join(__dirname, '..', '..', '..', '..', 'libs', 'udq_helper_utils'),
          }),
        ],
        handler: "lambda_handler",
        index: 'udq_data_reader.py',
        memorySize: 256,
        role: timestreamUdqRole,
        runtime: lambda.Runtime.PYTHON_3_7,
        timeout: cdk.Duration.minutes(15),
        logRetention: logs.RetentionDays.ONE_DAY,
        environment: {
          "TIMESTREAM_DATABASE_NAME": `${timestreamDB.databaseName}`,
          "TIMESTREAM_TABLE_NAME": `${timestreamTable.tableName}`,
        }
      });
      new cdk.CfnOutput(this, "TimestreamReaderUDQLambdaArn", { value: timestreamReaderUDQ.functionArn });
    }
  }
}
