// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createDerivedStore, createDerivedStoreHook, createStore, createStoreHook } from '@/lib/core/store';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/init/entities';
import { selectedStore } from '@/lib/stores/entity';
import type { PanelId } from '@/lib/types';

export const panelsStore = createStore(new Set<PanelId>());
export const hasDashboardStore = createDerivedStore(panelsStore, (state) => state.has('dashboard'));
export const usePanelsStore = createStoreHook(panelsStore);
export const useHasDashboardStore = createDerivedStoreHook(hasDashboardStore);

export function resetPanelsStore() {
  panelsStore.resetToInitialState();
}

// private subscriptions

panelsStore.subscribe((getState) => {
  const state = getState();

  if (state.size === 0) {
    selectedStore.setState(DEFAULT_SELECTED_ENTITY);
  }
});
