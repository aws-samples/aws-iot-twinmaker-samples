// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as TimestreamTelemetryCdkLambdas from '../lib/timestream_telemetry_lambdas-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new TimestreamTelemetryCdkLambdas.TimestreamTelemetryCdkLambdasStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
