// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {App, Fn, Tags, Stack, StackProps, CfnOutput, Duration} from 'aws-cdk-lib'
import { Construct } from 'constructs';
import { aws_logs as logs } from 'aws-cdk-lib';
import { aws_lambda as lambda } from 'aws-cdk-lib';
import {PythonFunction, PythonLayerVersion} from '@aws-cdk/aws-lambda-python-alpha';
import { aws_iam as iam } from 'aws-cdk-lib';

import * as path from 'path';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3UdqRole = new iam.Role(this, 's3UdqRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    });
    s3UdqRole.addManagedPolicy(iam.ManagedPolicy.fromManagedPolicyArn(this, "lambdaExecRole", "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"))
    s3UdqRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3ReadOnlyAccess"))

    const s3ReaderUDQ = new PythonFunction(this, 's3ReaderUDQ', {
      functionName: `iottwinmaker-${this.stackName}-s3ReaderUDQ`,
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
      role: s3UdqRole,
      runtime: lambda.Runtime.PYTHON_3_10,
      timeout: Duration.minutes(15),
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {}
    });
    new CfnOutput(this, "S3ReaderUDQLambdaArn", {value: s3ReaderUDQ.functionArn});
  }
}
