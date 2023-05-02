// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useTimeSeriesData } from '@iot-app-kit/react-components';
import { useMemo, useEffect } from 'react';

import { VIEWPORT } from '@/config/iottwinmaker';
import { dataStreamState } from '@/lib/state/data';
import { useDataSourceState } from '@/lib/state/twinMaker';
import type { TwinMakerEntityHistoryQuery, TimeSeriesDataQuery } from '@/lib/types';
import { createTimeSeriesQuery } from '@/lib/utils/entity';

export function TimeSeriesContext({ queries }: { queries: TwinMakerEntityHistoryQuery[] }) {
  const [dataSource] = useDataSourceState();

  const element = useMemo(() => {
    if (dataSource) {
      const timeSeriesQuery = createTimeSeriesQuery(dataSource, queries);
      return <TimeSeriesData key={crypto.randomUUID()} queries={timeSeriesQuery} />;
    }
    return null;
  }, [dataSource, queries]);

  return element;
}

function TimeSeriesData({ queries }: { queries: TimeSeriesDataQuery[] }) {
  const { dataStreams } = useTimeSeriesData({ queries, viewport: VIEWPORT });
  useEffect(() => dataStreamState.setState(dataStreams), [dataStreams]);
  return null;
}
