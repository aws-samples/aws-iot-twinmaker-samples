// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createStore, createStoreHook } from '@/lib/core/store';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/entities';
import type { EntitySummary, SelectedEntity, TimeSeriesDataQuery, TwinMakerEntityHistoryQuery } from '@/lib/types';

export const alarmHistoryQueryState = createStore<TwinMakerEntityHistoryQuery[]>([]);
export const alarmTimeSeriesQueryState = createStore<TimeSeriesDataQuery[]>([]);
export const dataTimeSeriesQueryState = createStore<TimeSeriesDataQuery[]>([]);
export const dataHistoryQueryState = createStore<TwinMakerEntityHistoryQuery[]>([]);
export const selectedState = createStore<SelectedEntity>(DEFAULT_SELECTED_ENTITY);
export const summaryState = createStore<Record<string, EntitySummary>>({});

export const useAlarmHistoryQueryState = createStoreHook(alarmHistoryQueryState);
export const useAlarmTimeSeriesQueryState = createStoreHook(alarmTimeSeriesQueryState);
export const useDataHistoryQueryState = createStoreHook(dataHistoryQueryState);
export const useDataTimeSeriesQueryState = createStoreHook(dataTimeSeriesQueryState);
export const useSelectedState = createStoreHook(selectedState);
export const useSummaryState = createStoreHook(summaryState);
