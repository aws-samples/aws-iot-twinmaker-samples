// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createState, createStateHook } from '@/lib/creators/state';
import type { PanelId } from '@/lib/types';

export const panelState = createState<PanelId[]>([]);

export const usePanelState = createStateHook(panelState);
