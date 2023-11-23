// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { $appConfig } from '@iot-prototype-kit/stores/config';
import { $site } from '@iot-prototype-kit/stores/site';
import { $user } from '@iot-prototype-kit/stores/user';
import type { AlarmState, Alarms } from '@iot-prototype-kit/types';

export function getAppKitConfig() {
  return $site.get()?.aws.iot.appkit;
}

export function getRouteConfigs() {
  return $site.get()?.routes;
}

export function getSiteConfigs() {
  return $user.get()?.siteConfigs;
}

export function getStatusBarConfig() {
  return $appConfig.get().statusBarComponents;
}

export function getTwinMakerConfig() {
  return $site.get()?.aws.iot.twinMaker;
}

export function getUserConfigs() {
  return $appConfig.get().userConfigs;
}
