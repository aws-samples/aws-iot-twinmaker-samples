// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0
import type { AwsCredentials } from '@/lib/core/auth/cognito';
import { createStore, createStoreHook } from '@/lib/core/store';
import { isNotNil } from '@/lib/core/utils/lang';
import type { User } from '@/lib/types';

/**
 * The time, in milliseconds, the timer should delay between checking credential expiration.
 */
const INTERVAL_DELAY = 1000;

let authCheckInterval: NodeJS.Timeout;

export const userState = createStore<User | null>(null);

export const useUserState = createStoreHook(userState);

/**
 * Check if the user credentials have expired and redirect to log in if so.
 */
userState.subscribe((getState) => {
  const state = getState();

  if (state?.awsCredentials) {
    authCheckInterval = setInterval(() => {
      if (hasCredentials(state.awsCredentials) === false) {
        userState.setState(null);
      }
    }, INTERVAL_DELAY);
  } else {
    clearInterval(authCheckInterval);
  }
});

function hasCredentials(creds?: AwsCredentials | null): creds is Exclude<AwsCredentials, undefined> {
  return isNotNil(creds) && creds.expiration.getTime() > Date.now();
}
