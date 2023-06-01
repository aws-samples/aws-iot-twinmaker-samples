// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { ALARM_STATUS_COLORS, STATUS_TIMELINE_TRACK_COLOR } from '@/lib/css/colors';
import type { AlarmState, AppKitThreshold } from '@/lib/types';

export const CHART_ALARM_THRESHOLDS: AppKitThreshold<AlarmState>[] = [
  {
    color: ALARM_STATUS_COLORS.High,
    label: { text: 'Yellow flower', show: true },
    value: 'High',
    comparisonOperator: 'EQ'
  },
  {
    color: ALARM_STATUS_COLORS.Medium,
    label: { text: 'Yellow flower1', show: true },
    value: 'Medium',
    comparisonOperator: 'EQ'
  },
  {
    color: ALARM_STATUS_COLORS.Low,
    label: { text: 'Low', show: true },
    value: 'Low',
    comparisonOperator: 'EQ'
  },
  {
    color: STATUS_TIMELINE_TRACK_COLOR,
    value: 'Normal',
    comparisonOperator: 'EQ'
  }
];
