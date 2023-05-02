// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createState, createStateHook } from '@/lib/creators/state';

export const hierarchyState = createState<string | null>(null);

export const useHierarchyState = createStateHook(hierarchyState);
