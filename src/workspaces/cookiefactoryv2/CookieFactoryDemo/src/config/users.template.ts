// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

/**
 * Authenticated user configuration.
 * RENAME THIS TEMPLATE TO `users.ts`
 */

import type { UserConfig } from '@/lib/types';

/**
 * @proprety `email` AWS Cognito user account credential
 * @proprety `password` AWS Cognito user account credential
 */
const users: UserConfig[] = [
  {
    email: 'user@cookiefactory',
    firstName: '__FILL_IN__',
    lastName: '__FILL_IN__',
    password: '__FILL_IN__',
    title: '__FILL_IN__'
  }
];

export default users;
