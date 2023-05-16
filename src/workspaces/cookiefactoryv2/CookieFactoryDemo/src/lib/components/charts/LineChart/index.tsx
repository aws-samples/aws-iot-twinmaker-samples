// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { LineChart as AppKitChart } from '@iot-app-kit/react-components';
import type { Except } from 'type-fest';

import { Chart, type ChartProps } from '@/lib/components/charts';

import styles from './styles.module.css';

export function LineChart(props: Except<ChartProps, 'ChartComponent'>) {
  return <Chart {...props} ChartComponent={AppKitChart} className={styles.root} />;
}
