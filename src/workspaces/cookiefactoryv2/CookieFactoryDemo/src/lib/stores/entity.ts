// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createStore, createStoreHook } from '@/lib/core/store';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/init/entities';
import type { EntitySummary, SelectedEntity } from '@/lib/types';

export const selectedStore = createStore<SelectedEntity>(DEFAULT_SELECTED_ENTITY);
export const summaryStore = createStore<Record<string, EntitySummary>>({});
export const useSelectedStore = createStoreHook(selectedStore);
export const useSummaryStore = createStoreHook(summaryStore);

export function resetEntityStores() {
  selectedStore.resetToInitialState();
  summaryStore.resetToInitialState();
}
