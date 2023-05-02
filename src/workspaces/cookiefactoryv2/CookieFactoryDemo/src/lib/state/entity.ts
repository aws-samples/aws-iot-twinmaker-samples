// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createState, createStateHook } from '@/lib/creators/state';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/entities';
import type { EntitySummary, SelectedEntity, TimeSeriesDataQuery, TwinMakerEntityHistoryQuery } from '@/lib/types';

export const alarmHistoryQueryState = createState<TwinMakerEntityHistoryQuery[]>([]);
export const alarmTimeSeriesQueryState = createState<TimeSeriesDataQuery[]>([]);
export const dataTimeSeriesQueryState = createState<TimeSeriesDataQuery[]>([]);
export const dataHistoryQueryState = createState<TwinMakerEntityHistoryQuery[]>([]);
export const selectedState = createState<SelectedEntity>(DEFAULT_SELECTED_ENTITY);
export const summaryState = createState<Record<string, EntitySummary>>({});

export const useAlarmHistoryQueryState = createStateHook(alarmHistoryQueryState);
export const useAlarmTimeSeriesQueryState = createStateHook(alarmTimeSeriesQueryState);
export const useDataHistoryQueryState = createStateHook(dataHistoryQueryState);
export const useDataTimeSeriesQueryState = createStateHook(dataTimeSeriesQueryState);
export const useSelectedState = createStateHook(selectedState);
export const useSummaryState = createStateHook(summaryState);
