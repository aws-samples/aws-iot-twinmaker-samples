// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createStore, createStoreHook } from '@/lib/core/store';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/init/entities';
import { dataSourceStore } from '@/lib/stores/iottwinmaker';
import type { EntitySummary, SelectedEntity, TimeSeriesDataQuery, TwinMakerEntityHistoryQuery } from '@/lib/types';
import { createTimeSeriesQueries } from '@/lib/utils/entity';

// export const alarmHistoryQueriesStore = createStore<TwinMakerEntityHistoryQuery[]>([]);
// export const dataHistoryQueriesStore = createStore<TwinMakerEntityHistoryQuery[]>([]);
export const selectedStore = createStore<SelectedEntity>(DEFAULT_SELECTED_ENTITY);
export const summaryStore = createStore<Record<string, EntitySummary>>({});
// export const timeSeriesQueriesStore = createStore<TimeSeriesDataQuery[]>([]);

// export const useAlarmHistoryQueriesStore = createStoreHook(alarmHistoryQueriesStore);
// export const useDataHistoryQueriesStore = createStoreHook(dataHistoryQueriesStore);
export const useSelectedStore = createStoreHook(selectedStore);
export const useSummaryStore = createStoreHook(summaryStore);
// export const useTimeSeriesQueriesStore = createStoreHook(timeSeriesQueriesStore);

export function resetEntityStores() {
  // alarmHistoryQueriesStore.resetToInitialState();
  // dataHistoryQueriesStore.resetToInitialState();
  selectedStore.resetToInitialState();
  summaryStore.resetToInitialState();
}

// private subscriptions

// alarmHistoryQueriesStore.subscribe(setTimeSeriesQueries);
// dataHistoryQueriesStore.subscribe(setTimeSeriesQueries);

// private methods

// function setTimeSeriesQueries() {
//   const dataSource = dataSourceStore.getState();

//   if (dataSource) {
//     timeSeriesQueriesStore.setState(
//       createTimeSeriesQueries(dataSource, [
//         ...alarmHistoryQueriesStore.getState(),
//         ...dataHistoryQueriesStore.getState()
//       ])
//     );
//   }
// }
