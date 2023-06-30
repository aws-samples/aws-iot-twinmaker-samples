// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createStore, createStoreHook } from '@/lib/core/store';

export const hierarchyStore = createStore<string | null>(null);
export const useHierarchyStore = createStoreHook(hierarchyStore);

export function resetHierarchyStore() {
  hierarchyStore.resetToInitialState();
}
