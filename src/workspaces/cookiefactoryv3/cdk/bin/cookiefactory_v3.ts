import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CookieFactoryV3Stack } from '../lib/cookiefactory_v3_stack';

import { AwsSolutionsChecks, HIPAASecurityChecks } from 'cdk-nag';
import { Aspects } from 'aws-cdk-lib';
import * as chainlitstack from "../lib/chainlit/chainlitStack"

const app = new cdk.App();
const stackName = app.node.tryGetContext('stackName');

console.log("stackName: ", stackName)

if (stackName === 'CookieFactoryV3') {
  const stack = new CookieFactoryV3Stack(app, 'CookieFactoryV3Stack', {
      env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
      stackName: app.node.tryGetContext("stackName"),
    });
}

if (stackName === 'CookieFactoryV3ChainlitStack') {
  const stack =  new chainlitstack.ChainlitStack(app, "CookieFactoryV3ChainlitStack", {
          env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
          stack_name: 'CookieFactoryV3ChainlitStack',
      });
}
// app.synth();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: false }));