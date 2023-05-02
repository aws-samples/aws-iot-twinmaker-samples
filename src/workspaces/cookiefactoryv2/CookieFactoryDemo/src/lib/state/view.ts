// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createState, createStateHook } from '@/lib/creators/state';
import type { ViewId } from '@/lib/types';

export const viewState = createState<ViewId | null>(null);

export const useViewState = createStateHook(viewState);
