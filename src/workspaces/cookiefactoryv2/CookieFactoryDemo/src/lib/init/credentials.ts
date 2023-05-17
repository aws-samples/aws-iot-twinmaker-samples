// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import cognito from '@/config/cognito';
import type { AuthenticatedUserConfig } from '@/lib/core/auth/cognito';

export const AWS_CREDENTIAL_CONFIG: Pick<
  AuthenticatedUserConfig,
  'clientId' | 'identityPoolId' | 'region' | 'userPoolId'
> = { ...cognito } as const;
