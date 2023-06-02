// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { AlarmState } from '../types';

export const ALARM_STATUS_COLORS: Record<AlarmState, string> = {
  High: '#ff5050',
  Medium: '#ff8e3d',
  Low: '#ddcf3c',
  Normal: '#7bd45e',
  Unknown: '#7e7f86'
};

export const LINE_CHART_COLORS = ['#71C9B9', '#ED76EF'];

export const STATUS_TIMELINE_TRACK_COLOR = '#424347';
