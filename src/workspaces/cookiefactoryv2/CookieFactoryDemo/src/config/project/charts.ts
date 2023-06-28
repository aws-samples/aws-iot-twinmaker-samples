// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { AlarmState, AppKitThreshold, ChartColors } from '@/lib/types';

export const ALARM_COLORS: Record<AlarmState | 'NormalGray', string> = {
  High: '#c63a3f', //'#E5343B', //'#ff5050',
  Medium: '#ea8741', //'#ff8e3d',
  Low: '#cfc340', //'#ddcf3c',
  Normal: '#7bd45e',
  NormalGray: '#adadad', // --text-layer-2-primary
  Unknown: '#757575' // --text-layer-2-tertiary
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
    color: '#454545', // --background-layer-2-accent
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
