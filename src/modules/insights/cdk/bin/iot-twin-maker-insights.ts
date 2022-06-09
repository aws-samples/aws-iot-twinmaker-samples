// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import "source-map-support/register";
import {App} from 'aws-cdk-lib'
import { IotTwinMakerSagemakerStack } from "../lib/iot-twin-maker-sagemaker-stack";
import { SimulationType } from "../lib/utils";
import { IotTwinMakerKdaStack } from "../lib/iot-twin-maker-kda-stack";

const app = new App();
const simulationType = SimulationType.MAPLESOFT;
new IotTwinMakerSagemakerStack(
  app,
  `CookieFactorySageMakerStack`,
  {
    simulationType: simulationType,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
    stackName: process.env.SAGEMAKER_STACK_NAME,
  }
);

new IotTwinMakerKdaStack(app, "CookieFactoryKdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackName: process.env.KDA_STACK_NAME,
});
