// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2021
// SPDX-License-Identifier: Apache-2.0

import {expect as expectCDK, MatchStyle, matchTemplate} from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import {IotTwinMakerSagemakerStack} from '../lib/iot-twin-maker-sagemaker-stack';
import {SimulationType} from '../lib/utils';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new IotTwinMakerSagemakerStack(app, 'MyTestStack', {simulationType: SimulationType.MAPLESOFT});
    // THEN
    expectCDK(stack).to(matchTemplate({
        "Resources": {}
    }, MatchStyle.EXACT))
});
