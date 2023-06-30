// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { createMutableStore, createMutableStoreHook } from '@/lib/core/store';
import type { GlobalControl } from '@/lib/types';

export const globalControlStore = createMutableStore<GlobalControl[]>([]);
export const useGlobalControlStore = createMutableStoreHook(globalControlStore);
