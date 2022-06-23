// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import 'source-map-support/register';
import { App } from 'aws-cdk-lib'
import { TimestreamTelemetryCdkLambdasStack } from '../lib/timestream_telemetry_lambdas-stack';

const app = new App();
new TimestreamTelemetryCdkLambdasStack(app, 'TimestreamTelemetryCdkLambdasStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  stackName: process.env.TIMESTREAM_TELEMETRY_STACK_NAME,

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
