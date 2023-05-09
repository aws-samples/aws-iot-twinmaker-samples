// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { LineChart as AppKitChart } from '@iot-app-kit/react-components';
import type { FunctionComponent } from 'react';
import type { Except } from 'type-fest';

import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { useTimeSeriesQuery } from '@/lib/hooks';
import type { TwinMakerEntityHistoryQuery } from '@/lib/types';

import css from './styles.module.css';

export type ChartProps = {
  ChartComponent: FunctionComponent<ChartComponentProps>;
  className?: ClassName;
  queries: TwinMakerEntityHistoryQuery[];
} & Partial<Except<Parameters<typeof AppKitChart>[0], 'queries'>>;

type ChartComponentProps = Parameters<typeof AppKitChart>[0];

export function Chart({ axis, ChartComponent, className, queries, styles, thresholds }: ChartProps) {
  const [timeSeriesQuery] = useTimeSeriesQuery(queries);

  return (
    <section className={createClassName(css.root, className)}>
      <ChartComponent axis={axis} queries={timeSeriesQuery} thresholds={thresholds} styles={styles} />
    </section>
  );
}
