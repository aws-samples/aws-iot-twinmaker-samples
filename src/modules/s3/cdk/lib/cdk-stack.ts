// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from '@aws-cdk/core';
import * as logs from '@aws-cdk/aws-logs';
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdapython from "@aws-cdk/aws-lambda-python";
import * as iam from "@aws-cdk/aws-iam";

import * as path from 'path';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const s3UdqRole = new iam.Role(this, 's3UdqRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      });
    s3UdqRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, "lambdaExecRole","arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"))
    s3UdqRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"))

    const s3ReaderUDQ = new lambdapython.PythonFunction(this, 's3ReaderUDQ', {
    entry: path.join(__dirname, '..', '..', 'lambda_function'),
    layers: [
        new lambdapython.PythonLayerVersion(this, 'udq_utils_layer', {
        entry: path.join(__dirname, '..', '..', '..', '..', 'libs', 'udq_helper_utils'),
        }),
    ],
    handler: "lambda_handler",
    index: 'udq_data_reader.py',
    memorySize: 256,
    role: s3UdqRole,
    runtime: lambda.Runtime.PYTHON_3_7,
    timeout: cdk.Duration.minutes(15),
    logRetention: logs.RetentionDays.ONE_DAY,
    environment: {
    }
    });
    new cdk.CfnOutput(this, "S3ReaderUDQLambdaArn", { value: s3ReaderUDQ.functionArn });
  }
}
