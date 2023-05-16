// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from 'react';

import { useDataSourceStore } from '@/lib/stores/iottwinmaker';
import type { TimeSeriesDataQuery, TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createTimeSeriesQueries } from '@/lib/utils/entity';

export function useTimeSeriesQueries(initialHistoryQueries: TwinMakerEntityHistoryQuery[] = []) {
  const [dataSource] = useDataSourceStore();
  const [historyQueries, setHistoryQueries] = useState(initialHistoryQueries);

  const timeSeriesQueries = useMemo<TimeSeriesDataQuery[]>(() => {
    return dataSource ? createTimeSeriesQueries(dataSource, historyQueries) : [];
  }, [dataSource, historyQueries]);

  return { timeSeriesQueries, setHistoryQueries };
}
