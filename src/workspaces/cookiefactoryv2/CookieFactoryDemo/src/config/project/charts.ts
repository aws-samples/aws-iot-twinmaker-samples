// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { GRAY_COLORS } from '@/lib/css/colors';
import type { AlarmState, AppKitThreshold, ChartColors } from '@/lib/types';

export const ALARM_COLORS: Record<AlarmState | 'NormalGray', string> = {
  High: '#ff5050',
  Medium: '#ff8e3d',
  Low: '#ddcf3c',
  Normal: '#7bd45e',
  NormalGray: GRAY_COLORS.Gray11,
  Unknown: GRAY_COLORS.Gray30
};

export const CHART_ALARM_THRESHOLDS: AppKitThreshold<AlarmState>[] = [
  {
    color: ALARM_COLORS.High,
    label: { text: 'High', show: true },
    value: 'High',
    comparisonOperator: 'EQ'
  },
  {
    color: ALARM_COLORS.Medium,
    label: { text: 'Medium', show: true },
    value: 'Medium',
    comparisonOperator: 'EQ'
  },
  {
    color: ALARM_COLORS.Low,
    label: { text: 'Low', show: true },
    value: 'Low',
    comparisonOperator: 'EQ'
  },
  {
    color: GRAY_COLORS.Gray45,
    value: 'Normal',
    comparisonOperator: 'EQ'
  }
];

export const CHART_COLORS: Record<ChartColors, { color: string; index: number }> = {
  Purple: { color: '#ed76ef', index: 2 },
  Teal: { color: '#71c9b9', index: 1 }
};

export const CHART_COLOR_POOL = Object.values(CHART_COLORS)
  .sort((a, b) => {
    return a.index - b.index;
  })
  .map((item) => item.color);
