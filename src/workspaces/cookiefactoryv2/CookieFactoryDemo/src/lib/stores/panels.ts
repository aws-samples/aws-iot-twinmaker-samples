// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_PANEL_ID } from '@/config/project';
import { createDerivedStore, createDerivedStoreHook, createStore, createStoreHook } from '@/lib/core/store';
import { DEFAULT_SELECTED_ENTITY } from '@/lib/init/entities';
import { selectedStore } from '@/lib/stores/entity';
import type { PanelId } from '@/lib/types';

export const panelsStore = createStore<PanelId[]>(DEFAULT_PANEL_ID ? [DEFAULT_PANEL_ID] : []);
export const hasDashboardStore = createDerivedStore(panelsStore, (panels) => {
  return panels.includes('dashboard');
});

export const usePanelsStore = createStoreHook(panelsStore);
export const useHasDashboardStore = createDerivedStoreHook(hasDashboardStore);

export function resetPanelsStore() {
  panelsStore.resetToInitialState();
}

panelsStore.subscribe((getState) => {
  const state = getState();

  if (state.length === 0) {
    selectedStore.setState(DEFAULT_SELECTED_ENTITY);
  }
});
