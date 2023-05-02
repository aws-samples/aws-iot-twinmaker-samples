// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createMutableState, createMutableStateHook } from '@/lib/creators/state';
import type { GlobalControl } from '@/lib/types';

export const globalControlState = createMutableState<GlobalControl[]>([]);

export const useGlobalControlState = createMutableStateHook(globalControlState);
