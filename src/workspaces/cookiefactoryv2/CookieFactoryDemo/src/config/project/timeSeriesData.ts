// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { TimeSeriesDataRequestSettings, Viewport } from '@/lib/types';

export const REQUEST_SETTINGS: TimeSeriesDataRequestSettings = {
  // See https://awslabs.github.io/iot-app-kit/?path=/docs/react-hooks-usetimeseriesdata--docs#kitchen-sink-example-utilization-with-all-features
  refreshRate: 2000
};

export const VIEWPORT: Viewport = { duration: '15m' };
