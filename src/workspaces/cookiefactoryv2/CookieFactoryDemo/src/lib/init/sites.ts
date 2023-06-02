// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import sites, { getLookUpKey } from '@/config/sites';
import { userStore } from '@/lib/stores/user';
import type { Site } from '@/lib/types';

export function getSites() {
  const user = userStore.getState();

  if (user) {
    const key = getLookUpKey(user);
    return sites[key].map<Site>((config) => ({ ...config, health: 'Normal', entities: {} }));
  }

  return [];
}
