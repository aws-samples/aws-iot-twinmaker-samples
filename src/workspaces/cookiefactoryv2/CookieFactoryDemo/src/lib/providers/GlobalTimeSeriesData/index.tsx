// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useTimeSeriesData } from '@iot-app-kit/react-components';
import { useMemo, type ReactNode } from 'react';

import { REQUEST_SETTINGS, VIEWPORT } from '@/config/project';
import { throttle } from '@/lib/core/utils/lang';
import { dataStreamsStore } from '@/lib/stores/data';
import { useDataSourceStore } from '@/lib/stores/iottwinmaker';
import type {
  DataStream,
  Primitive,
  TimeSeriesDataQuery,
  TimeSeriesDataRequestSettings,
  TwinMakerEntityHistoryQuery
} from '@/lib/types';
import { createTimeSeriesQueries } from '@/lib/utils/entity';

const DEFAULT_REQUEST_SETTINGS: Required<TimeSeriesDataRequestSettings> = {
  // Seetings require all or none even though each is optional.
  // See https://awslabs.github.io/iot-app-kit/?path=/docs/react-hooks-usetimeseriesdata--docs#kitchen-sink-example-utilization-with-all-features

  // Higher buffer will lead to more off-viewport data to be requested. Useful for panning/zoom gestures
  requestBuffer: 0.2, // 20% buffer

  // refresh rate in milliseconds for how frequently to request data if applicable to the datasource
  refreshRate: 1000,

  // The 'resolution' which we want the data to be displayed at. For example, raw data, 1 minute aggregated, hourly aggregated, etc.
  // Must be a resolution supported by your datasource. Full options contained in the data sources documentation you are utilizing.
  // If left undefined, will automatically choose a supported resolution based on the duration of the viewport.
  resolution: '1m',

  // Specifies that all the data points within the viewport are to be fetched
  fetchFromStartToEnd: true,

  // Specifies that the most recent data point before the viewport is fetched. Useful for some visualizations, such as a line chart to draw the connecting line between the first data point present on the chart.
  fetchMostRecentBeforeStart: true,

  // Specifies that the most recent data point contained within the viewport. Useful for visualizations that only need a single data point, like a KPI, or Status.
  fetchMostRecentBeforeEnd: true
};

export function GlobalTimeSeriesData({
  children,
  historyQueries
}: {
  children?: ReactNode;
  historyQueries: TwinMakerEntityHistoryQuery[];
}) {
  console.log('AppKitTimeSeriesDataWrapper');

  return (
    <>
      {children}
      <GlobalTimeSeriesDataInner historyQueries={historyQueries} />
    </>
  );
}

function GlobalTimeSeriesDataInner({ historyQueries }: { historyQueries: TwinMakerEntityHistoryQuery[] }) {
  const [dataSource] = useDataSourceStore();

  return useMemo(() => {
    if (dataSource) {
      const timeSeriesQueries = createTimeSeriesQueries(dataSource, historyQueries);
      return <AppKitTimeSeriesDataWrapper timeSeriesQueries={timeSeriesQueries} />;
    }

    return <></>;
  }, [dataSource, historyQueries]);
}

// private

function AppKitTimeSeriesDataWrapper({ timeSeriesQueries }: { timeSeriesQueries: TimeSeriesDataQuery[] }) {
  const { dataStreams } = useTimeSeriesData({
    queries: timeSeriesQueries,
    settings: { ...DEFAULT_REQUEST_SETTINGS, ...REQUEST_SETTINGS },
    viewport: VIEWPORT
  });

  setDataStreams(dataStreams);

  return <></>;
}

const setDataStreams = throttle((dataStreams: DataStream<Primitive>[]) => {
  dataStreamsStore.setState(dataStreams);
}, 1000);
