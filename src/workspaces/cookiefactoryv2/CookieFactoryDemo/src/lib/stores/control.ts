// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createMutableStore, createMutableStoreHook } from '@/lib/core/store';
import type { GlobalControl } from '@/lib/types';

export const globalControlState = createMutableStore<GlobalControl[]>([]);

export const useGlobalControlState = createMutableStoreHook(globalControlState);
