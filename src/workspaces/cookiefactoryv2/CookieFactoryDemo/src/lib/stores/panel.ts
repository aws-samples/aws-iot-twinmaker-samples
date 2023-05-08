// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createStore, createStoreHook } from '@/lib/core/store';
import type { PanelId } from '@/lib/types';

export const panelState = createStore<PanelId[]>([]);

export const usePanelState = createStoreHook(panelState);
