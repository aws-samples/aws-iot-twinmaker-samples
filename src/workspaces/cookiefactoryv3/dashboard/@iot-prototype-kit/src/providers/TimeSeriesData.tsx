// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useTimeSeriesData } from '@iot-app-kit/react-components';

import { useStore } from '@iot-prototype-kit/core/store';
import { isNil, throttle } from '@iot-prototype-kit/core/utils/lang2';
import { $dataStreams } from '@iot-prototype-kit/stores/data';
import { $dataSource } from '@iot-prototype-kit/stores/iottwinmaker';
import type {
  DataStream,
  Primitive,
  TimeSeriesDataRequestSettings,
  TwinMakerDataSource,
  TwinMakerEntityHistoryQuery
} from '@iot-prototype-kit/types';
import { getAppKitConfig } from '@iot-prototype-kit/utils/config';
import { createTimeSeriesQueries } from '@iot-prototype-kit/utils/entity';
import { useEffect } from 'react';

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

const setDataStreams = throttle((dataStreams: DataStream<Primitive>[]) => {
  $dataStreams.set(dataStreams);
}, 500);

export function TimeSeriesData({ entityHistoryQueries }: { entityHistoryQueries: TwinMakerEntityHistoryQuery[] }) {
  const dataSource = useStore($dataSource);
  if (isNil(dataSource)) return null;
  return (
    <AppKitTimeSeriesData
      key={JSON.stringify(entityHistoryQueries)}
      dataSource={dataSource}
      entityHistoryQueries={entityHistoryQueries}
    />
  );
}

function AppKitTimeSeriesData({
  dataSource,
  entityHistoryQueries
}: {
  dataSource: TwinMakerDataSource;
  entityHistoryQueries: TwinMakerEntityHistoryQuery[];
}) {
  const appKitConfig = getAppKitConfig();
  const { dataStreams } = useTimeSeriesData({
    queries: createTimeSeriesQueries(dataSource, entityHistoryQueries),
    settings: { ...DEFAULT_REQUEST_SETTINGS, ...appKitConfig?.timeSeriesData?.requestSettings },
    viewport: appKitConfig?.timeSeriesData?.viewport
  });

  useEffect(() => {
    setDataStreams(dataStreams);
  }, [dataStreams]);

  return null;
}
