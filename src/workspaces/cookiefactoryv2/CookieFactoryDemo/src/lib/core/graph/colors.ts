// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { AlarmState } from './types';

export const ALARM_COLORS: Record<AlarmState, string> = {
  High: '#ff5050',
  Medium: '#ff8e3d',
  Low: '#ddcf3c',
  Normal: '#CECFD1',
  Unknown: '#7e7f86'
};

export const GRAPH_COLORS = {
  Black: '#000000',
  Gray01: '#F8F8F9',
  Gray02: '#F4F4F5',
  Gray04: '#ECECED',
  Gray06: '#E3E3E5',
  Gray08: '#DBDBDD',
  Gray10: '#D2D3D5',
  Gray12: '#CACACD',
  Gray14: '#C1C2C5',
  Gray16: '#B9BABD',
  Gray18: '#B0B1B6',
  Gray20: '#A8A9AE',
  Gray25: '#93949A',
  Gray30: '#7E7F86',
  Gray35: '#6A6B71',
  Gray40: '#56575C',
  Gray45: '#424347',
  Gray50: '#2F2F32',
  Gray55: '#1B1B1D',
  Gray60: '#070708',
  White: '#ffffff'
};
