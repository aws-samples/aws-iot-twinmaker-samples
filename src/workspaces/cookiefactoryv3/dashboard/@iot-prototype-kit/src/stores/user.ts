// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { IoTTwinMakerClient } from '@aws-sdk/client-iottwinmaker';

import { action, atom } from '@iot-prototype-kit/core/store';
import type { AwsCredentials } from '@iot-prototype-kit/core/auth/cognito';
import { customUserAgent } from '@iot-prototype-kit/core/sdk';
import { isNotNil } from '@iot-prototype-kit/core/utils/lang2';
import { $client, resetClient } from '@iot-prototype-kit/stores/iottwinmaker';
import { resetSite } from '@iot-prototype-kit/stores/site';
import type { User } from '@iot-prototype-kit/types';

const EXPIRATION_CHECK_INTERVAL_IN_MS = 1000;
let authCheckInterval: NodeJS.Timeout;

export const $user = atom<User | null>(null);

export const resetUser = action($user, 'resetUser', ({ set }) => set(null));

// Check if the user credentials have expired and purge user if so
$user.listen((user) => {
  if (user?.awsCredentials) {
    authCheckInterval = setInterval(() => {
      if (hasCredentials(user.awsCredentials) === false) {
        $user.set(null);
      }
    }, EXPIRATION_CHECK_INTERVAL_IN_MS);
  } else {
    clearInterval(authCheckInterval);
  }
});

// Initialize or dispose IoTTwinMakerClient on useer state change
$user.listen((user) => {
  if (user) {
    $client.set(
      new IoTTwinMakerClient({
        credentials: user.awsCredentials,
        customUserAgent,
        region: user.awsCredentials!.region
      })
    );
  } else {
    resetClient();
    resetSite();
  }
});

// private methods

function hasCredentials(creds?: AwsCredentials | null): creds is Exclude<AwsCredentials, undefined> {
  return isNotNil(creds) && creds.expiration.getTime() > Date.now();
}
