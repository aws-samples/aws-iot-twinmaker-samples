// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import sites from '@/config/sites';
import type { Site } from '@/lib/types';

export const SITES = sites.map<Site>((config) => ({ ...config, health: 'Normal', entities: {} }));
