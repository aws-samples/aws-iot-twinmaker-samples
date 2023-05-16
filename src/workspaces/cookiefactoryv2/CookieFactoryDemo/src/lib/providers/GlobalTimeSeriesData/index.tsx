// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useTimeSeriesData } from '@iot-app-kit/react-components';

import { VIEWPORT } from '@/config/iottwinmaker';
import { throttle } from '@/lib/core/utils/lang';
import { dataStreamsStore } from '@/lib/stores/data';
import { useTimeSeriesQueriesStore } from '@/lib/stores/entity';
import type { DataStream, Primitive, TimeSeriesDataQuery } from '@/lib/types';
import { useMemo } from 'react';

export function GlobalTimeSeriesData() {
  const [timeSeriesQueries] = useTimeSeriesQueriesStore();

  return useMemo(() => {
    return <AppKitTimeSeriesDataWrapper key={crypto.randomUUID()} timeSeriesQueries={timeSeriesQueries} />;
  }, [timeSeriesQueries]);
}

// private

function AppKitTimeSeriesDataWrapper({ timeSeriesQueries }: { timeSeriesQueries: TimeSeriesDataQuery[] }) {
  const { dataStreams } = useTimeSeriesData({ queries: timeSeriesQueries, viewport: VIEWPORT });
  setDataStreams(dataStreams);
  return null;
}

const setDataStreams = throttle((dataStreams: DataStream<Primitive>[]) => {
  dataStreamsStore.setState(dataStreams);
}, 500);
