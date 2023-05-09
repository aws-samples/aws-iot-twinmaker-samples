// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createStore, createStoreHook } from '@/lib/core/store';
import type { ViewId } from '@/lib/types';

export const viewState = createStore<ViewId | null>(null);

export const useViewState = createStoreHook(viewState);
