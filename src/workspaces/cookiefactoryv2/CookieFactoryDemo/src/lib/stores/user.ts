// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { IoTTwinMakerClient } from '@aws-sdk/client-iottwinmaker';

import { SDK_CUSTOM_USER_AGENT } from '@/config/iottwinmaker';
import type { AwsCredentials } from '@/lib/core/auth/cognito';
import { createStore, createStoreHook } from '@/lib/core/store';
import { isNotNil } from '@/lib/core/utils/lang';
import { clientStore } from '@/lib/stores/iottwinmaker';
import { siteStore } from '@/lib/stores/site';
import type { User } from '@/lib/types';

const EXPIRATION_CHECK_INTERVAL_IN_MS = 1000;
let authCheckInterval: NodeJS.Timeout;

export const userStore = createStore<User | null>(null);

export const useUserStore = createStoreHook(userStore);

// private subscriptions

// check if the user credentials have expired and redirect to log in if so
userStore.subscribe((getState) => {
  const state = getState();

  if (state?.awsCredentials) {
    authCheckInterval = setInterval(() => {
      if (hasCredentials(state.awsCredentials) === false) {
        userStore.setState(null);
      }
    }, EXPIRATION_CHECK_INTERVAL_IN_MS);
  } else {
    clearInterval(authCheckInterval);
  }
});

// Initialize or dispose IoTTwinMakerClient on useer state change
userStore.subscribe((getState) => {
  const state = getState();

  if (state) {
    clientStore.setState(
      new IoTTwinMakerClient({
        credentials: state.awsCredentials,
        customUserAgent: SDK_CUSTOM_USER_AGENT,
        region: state.awsCredentials!.region
      })
    );
  } else {
    const client = clientStore.getState();

    client?.destroy();
    clientStore.setState(null);
    siteStore.setState(null);
  }
});

// private methods

function hasCredentials(creds?: AwsCredentials | null): creds is Exclude<AwsCredentials, undefined> {
  return isNotNil(creds) && creds.expiration.getTime() > Date.now();
}
