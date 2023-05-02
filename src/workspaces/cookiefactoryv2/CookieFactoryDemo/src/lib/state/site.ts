// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import { createState, createStateHook } from '@/lib/creators/state';
import type { Site } from '@/lib/types';

export const siteState = createState<Site | null>(null);

export const useSiteState = createStateHook(siteState);
