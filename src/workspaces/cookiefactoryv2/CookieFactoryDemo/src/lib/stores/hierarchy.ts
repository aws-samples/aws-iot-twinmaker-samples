// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createStore, createStoreHook } from '@/lib/core/store';

export const hierarchyState = createStore<string | null>(null);

export const useHierarchyState = createStoreHook(hierarchyState);
