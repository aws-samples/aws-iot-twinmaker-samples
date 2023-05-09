// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createStore, createStoreHook } from '@/lib/core/store';
import type { Site } from '@/lib/types';

export const siteState = createStore<Site | null>(null);

export const useSiteState = createStoreHook(siteState);
