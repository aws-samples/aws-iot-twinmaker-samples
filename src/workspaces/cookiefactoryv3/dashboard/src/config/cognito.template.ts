// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

/**
 * AWS Cognito authenticated flow configuration.
 * RENAME THIS TEMPLATE TO `cognito.ts`
 */

import type { CognitoAuthenticatedFlowConfig } from '@/lib/core/auth/cognito';

const cognito: CognitoAuthenticatedFlowConfig = {
  clientId: '__FILL_IN__',
  identityPoolId: '__FILL_IN__',
  region: '__FILL_IN__',
  userPoolId: '__FILL_IN__'
};

export default cognito;
