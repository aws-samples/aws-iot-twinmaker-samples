// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { ALARM_STATUS_COLORS } from '@/lib/css/colors';

export const GRAPH_COLORS = {
  HEALTH_HIGH: ALARM_STATUS_COLORS.High,
  HEALTH_MEDIUM: ALARM_STATUS_COLORS.Medium,
  HEALTH_LOW: ALARM_STATUS_COLORS.Low,
  HEALTH_OFFLINE: ALARM_STATUS_COLORS.Unknown,
  HEALTH_OK: ALARM_STATUS_COLORS.Normal,
  HEALTH_UNKNOWN: ALARM_STATUS_COLORS.Unknown,
  SKY_400: '#38BDF8',
  GRAY_01: '#F8F8F9',
  GRAY_02: '#F4F4F5',
  GRAY_04: '#ECECED',
  GRAY_06: '#E3E3E5',
  GRAY_08: '#DBDBDD',
  GRAY_10: '#D2D3D5',
  GRAY_12: '#CACACD',
  GRAY_14: '#C1C2C5',
  GRAY_16: '#B9BABD',
  GRAY_18: '#B0B1B6',
  GRAY_20: '#A8A9AE',
  GRAY_25: '#93949A',
  GRAY_30: '#7E7F86',
  GRAY_35: '#6A6B71',
  GRAY_40: '#56575C',
  GRAY_45: '#424347',
  GRAY_50: '#2F2F32',
  GRAY_55: '#1B1B1D',
  GRAY_60: '#070708',
  WHITE: '#fff'
};

// https://stackoverflow.com/questions/71816702/coordinates-of-dot-on-an-hexagon-path
export const NODE_HEXAGON_HEXAGON_POINTS = [
  0, 1, -0.8660254037844386, 0.5, -0.8660254037844386, -0.5, 0, -1, 0.8660254037844386, -0.5, 0.8660254037844386, 0.5
];

export const NODE_DIAMOND_DEFAULT_SIZE = 90;
export const NODE_HEXAGON_DEFAULT_SIZE = 100;
export const NODE_ELLIPSE_DEFAULT_SIZE = 110;
export const NODE_RECTANGLE_DEFAULT_SIZE = 70;
