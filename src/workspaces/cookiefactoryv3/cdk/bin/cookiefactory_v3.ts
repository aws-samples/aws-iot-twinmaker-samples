// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CookieFactoryV3Stack } from '../lib/cookiefactory_v3_stack';

import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();
const stack = new CookieFactoryV3Stack(app, 'CookieFactoryV3Stack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  stackName: app.node.tryGetContext("stackName"),
});

// Apply CDK Nag checks to the stack
Aspects.of(app).add(new AwsSolutionsChecks());

// Add Nag suppressions for specific resources
NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/CookiefactoryUserPool/Resource',
  [
    {
      id: 'AwsSolutions-COG2',
      reason: 'MFA is not required for this demo application but is recommended to be enabled in production.',
    },
    {
      id: 'AwsSolutions-COG3',
      reason: 'AdvancedSecurityMode is not required for this demo application but is recommended to be enabled in production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/CognitoAuthRole/CognitoAuthenticatedRole/DefaultPolicy/Resource',
  [
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Wildcard policy is provided on purpose to support functionality of the application.',
    }
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/ViteBucket/Resource',
  [
    {
      id: 'AwsSolutions-S1',
      reason: 'Server access logging is not enabled for this demo bucket to reduce costs but should be enabled in production.',
    }
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/ViteAppDistribution/Resource',
  [
    {
      id: 'AwsSolutions-CFR1',
      reason: 'Geo restrictions are not applied in this demo but should be considered based on business requirements.',
    },
    {
      id: 'AwsSolutions-CFR2',
      reason: 'AWS WAF is not integrated in this demo to simplify setup but should be considered for production.',
    },
    {
      id: 'AwsSolutions-CFR3',
      reason: 'Access logging is disabled in this demo environment but should be enabled in production for auditing purposes.',
    },
    {
      id: 'AwsSolutions-CFR4',
      reason: 'TLSv1.2 or higher should be enforced in production; this demo may allow lower protocols for testing purposes.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/CFV3ParamSecret/Resource',
  [
    {
      id: 'AwsSolutions-SMG4',
      reason: 'Automatic rotation is not scheduled for demo secrets but is recommended for production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/TimestreamTelemetry',
  [
    {
      id: 'AwsSolutions-TS3',
      reason: 'Customer Managed KMS Key is not used in this demo for simplicity but is recommended for production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/timestreamUdqRole/Resource',
  [
    {
      id: 'AwsSolutions-IAM4',
      reason: 'AWS managed policies are used in this demo but custom policies should be created for production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/timestreamUdqRole/DefaultPolicy/Resource',
  [
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Wildcard permissions are necessary for demo purposes but should be scoped down for production use.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/timestreamReaderUDQ/Resource',
  [
    {
      id: 'AwsSolutions-L1',
      reason: 'The non-container Lambda function is not configured to use the latest runtime version for the demo, but this should be updated in production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/Resource',
  [
    {
      id: 'AwsSolutions-IAM4',
      reason: 'AWS managed policies are used in this demo but should be replaced with custom policies in production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole/DefaultPolicy/Resource',
  [
    {
      id: 'AwsSolutions-IAM5',
      reason: 'Wildcard permissions are provided for demo purposes and should be scoped down in production.',
    },
  ]
);

NagSuppressions.addResourceSuppressionsByPath(
  stack,
  '/CookieFactoryV3Stack/syntheticDataUDQ/Resource',
  [
    {
      id: 'AwsSolutions-L1',
      reason: 'The non-container Lambda function is not configured to use the latest runtime version for the demo, but this should be updated in production.',
    },
  ]
);

app.synth();
