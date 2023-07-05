// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createStore, createStoreHook } from '@/lib/core/store';
import type { ViewId } from '@/lib/types';

export const viewStore = createStore<ViewId | null>(null);
export const useViewStore = createStoreHook(viewStore);

export function resetViewStore() {
  viewStore.resetToInitialState();
}
