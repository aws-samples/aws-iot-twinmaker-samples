// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';

import { useDataSourceState } from '@/lib/state/twinMaker';
import type { TimeSeriesDataQuery, TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createTimeSeriesQuery } from '@/lib/utils/entity';

export function useTimeSeriesQuery(
  initialEntityHistoryQuery: TwinMakerEntityHistoryQuery[] = []
): [TimeSeriesDataQuery[], React.Dispatch<React.SetStateAction<TwinMakerEntityHistoryQuery[]>>] {
  const [dataSource] = useDataSourceState();
  const [historyQuery, setHistoryQuery] = useState<TwinMakerEntityHistoryQuery[]>(initialEntityHistoryQuery);

  const timeSeriesQuery = useMemo<TimeSeriesDataQuery[]>(() => {
    return dataSource ? createTimeSeriesQuery(dataSource, historyQuery) : [];
  }, [dataSource, historyQuery]);

  return [timeSeriesQuery, setHistoryQuery];
}
