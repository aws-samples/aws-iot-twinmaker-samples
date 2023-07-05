// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createStore, createStoreHook } from '@/lib/core/store';

export const hopStore = createStore<-1 | 0 | 1 | 2>(-1);
export const useHopStore = createStoreHook(hopStore);
