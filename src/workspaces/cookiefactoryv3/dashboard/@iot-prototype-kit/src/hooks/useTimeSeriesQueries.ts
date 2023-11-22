// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { useMemo, useState } from 'react';

import { useStore } from '@iot-prototype-kit/core/store';
import { $dataSource } from '@iot-prototype-kit/stores/iottwinmaker';
import type { TimeSeriesDataQuery, TwinMakerEntityHistoryQuery } from '@iot-prototype-kit/types';
import { createTimeSeriesQueries } from '@iot-prototype-kit/utils/entity';

export function useTimeSeriesQueries(initialHistoryQueries: TwinMakerEntityHistoryQuery[] = []) {
  const dataSource = useStore($dataSource);
  const [historyQueries, setHistoryQueries] = useState(initialHistoryQueries);

  const timeSeriesQueries = useMemo<TimeSeriesDataQuery[]>(() => {
    return dataSource ? createTimeSeriesQueries(dataSource, historyQueries) : [];
  }, [dataSource, historyQueries]);

  return { timeSeriesQueries, setHistoryQueries };
}
