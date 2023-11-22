// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { $site } from '@iot-prototype-kit/stores/site';

export function getEventsConfig() {
  return $site.get()?.events;
}
