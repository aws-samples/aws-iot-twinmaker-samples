#!/usr/bin/env node

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import 'source-map-support/register';
import { App } from 'aws-cdk-lib'
import { CdkStack } from '../lib/cdk-stack';

const app = new App();
new CdkStack(app, 'CdkStack', {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

    stackName: "IoTTwinMakerCookieFactoryS3",
});
