// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { LineChart as Chart } from '@iot-app-kit/react-components';
import type { FunctionComponent } from 'react';
import type { Except } from 'type-fest';

import { useTimeSeriesQuery } from '@/lib/hooks';
import type { TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createClassName, type ClassName } from '@/lib/utils/element';

import css from './styles.module.css';

export type BaseChartProps = {
  ChartComponent: FunctionComponent<ChartComponentProps>;
  className?: ClassName;
  queries: TwinMakerEntityHistoryQuery[];
} & Partial<Except<Parameters<typeof Chart>[0], 'queries'>>;

type ChartComponentProps = Parameters<typeof Chart>[0];

export function BaseChart({ axis, ChartComponent, className, queries, styles, thresholds }: BaseChartProps) {
  const [timeSeriesQuery] = useTimeSeriesQuery(queries);

  return (
    <section className={createClassName(css.root, className)}>
      <ChartComponent axis={axis} queries={timeSeriesQuery} thresholds={thresholds} styles={styles} />
    </section>
  );
}
