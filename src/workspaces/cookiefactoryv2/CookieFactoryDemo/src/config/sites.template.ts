// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

/**
 * Project sites configuration.
 * RENAME THIS TEMPLATE TO `sites.ts`
 */
import type { SiteConfig } from '@/lib/types';

const sites: SiteConfig[] = [
  {
    id: crypto.randomUUID(),
    iottwinmaker: {
      sceneId: 'CookieFactory',
      workspaceId: '__FILL_IN__'
    },
    location: '1 Main Street, Bakersville, NC, USA',
    name: 'Bakersville Central'
  }
];

export default sites;
