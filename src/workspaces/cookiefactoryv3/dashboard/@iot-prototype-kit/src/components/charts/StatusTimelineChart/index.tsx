// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { StatusTimeline as AppKitChart } from '@iot-app-kit/react-components';
import type { Except } from 'type-fest';

import { createClassName } from '@iot-prototype-kit/core/utils/element';

import { Chart, type ChartProps } from '../Chart';

import styles from './styles.module.css';

export function StatusTimelineChart(props: Except<ChartProps, 'ChartComponent'>) {
  return <Chart {...props} ChartComponent={AppKitChart} className={createClassName(styles.root, props.className)} />;
}
