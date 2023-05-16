// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import type { LineChart as AppKitChart } from '@iot-app-kit/react-components';
import { useMemo, type FunctionComponent } from 'react';
import type { Except } from 'type-fest';

import { createClassName, type ClassName } from '@/lib/core/utils/element';
import { useDataSourceStore } from '@/lib/stores/iottwinmaker';
import type { TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createTimeSeriesQueries } from '@/lib/utils/entity';

import css from './styles.module.css';

export type ChartProps = {
  ChartComponent: FunctionComponent<ChartComponentProps>;
  className?: ClassName;
  historyQueries: TwinMakerEntityHistoryQuery[];
} & Partial<Except<Parameters<typeof AppKitChart>[0], 'queries'>>;

type ChartComponentProps = Parameters<typeof AppKitChart>[0];

export function Chart({ axis, ChartComponent, className, historyQueries, styles, thresholds }: ChartProps) {
  const [dataSource] = useDataSourceStore();

  const timeSeriesQueries = useMemo(() => {
    return dataSource ? createTimeSeriesQueries(dataSource, historyQueries) : [];
  }, [dataSource, historyQueries]);

  return (
    <section className={createClassName(css.root, className)}>
      <ChartComponent axis={axis} queries={timeSeriesQueries} thresholds={thresholds} styles={styles} />
    </section>
  );
}
