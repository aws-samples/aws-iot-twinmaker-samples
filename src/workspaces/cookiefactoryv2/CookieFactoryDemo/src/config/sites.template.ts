// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

/**
 * AWS Cognito authenticated flow configuration.
 * RENAME THIS TEMPLATE TO `cognito.ts`
 */
import type { SiteConfig } from '@/lib/types';

export const WORKSPACE_ID = '__FILL_IN__';

const sites: SiteConfig[] = [
  {
    awsConfig: {
      sceneId: 'CookieFactory',
      workspaceId: WORKSPACE_ID
    },
    id: crypto.randomUUID(),
    location: '1 Main Street, Bakersville, NC, USA',
    name: 'Bakersville Central'
  }
];

export default sites;
