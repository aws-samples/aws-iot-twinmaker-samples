// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { getAwsCredentials } from '@iot-prototype-kit/core/auth/cognito';
import type { CognitoAuthenticatedFlowConfig, AuthenticatedUserConfig } from '@iot-prototype-kit/core/auth/cognito';
import type { User, UserConfig } from '@iot-prototype-kit/types';
import type { ValueOf } from 'type-fest';

export async function authenticateUser(
  cognito: CognitoAuthenticatedFlowConfig, 
  password: string, 
  user: Omit<User, 'awsCredentials' | 'id'>
): Promise<User | null> {
  try {
    const awsCredentials = await getAwsCredentials({ ...cognito, password:password, username: user.email });
    return { 
      ...user,
      awsCredentials: awsCredentials as Readonly<typeof awsCredentials>, 
      id: crypto.randomUUID(),  
    };
  } catch {
    return null;
  }
}

// export function findUserConfig(userConfigs: UserConfig[], email: ValueOf<UserConfig, 'email'>): UserConfig | undefined {
//   return userConfigs.find((userConfig) => userConfig.email === email);
// }

export function getUserFullName({ firstName, lastName }: User ): string {
  return `${firstName} ${lastName ?? ''}`.trim();
}
