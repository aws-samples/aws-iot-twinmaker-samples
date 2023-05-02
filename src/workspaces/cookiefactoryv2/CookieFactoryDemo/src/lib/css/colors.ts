// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { AlarmState } from '../types';

export const ALARM_STATUS_COLORS: Record<AlarmState, string> = {
  High: '#F24040',
  Medium: '#FA8B38',
  Low: '#DCCE38',
  Normal: '#97989E',
  Unknown: '#56575C'
};

export const LINE_CHART_COLORS = ['#71C9B9', '#ED76EF'];

export const STATUS_TIMELINE_TRACK_COLOR = '#424347';
