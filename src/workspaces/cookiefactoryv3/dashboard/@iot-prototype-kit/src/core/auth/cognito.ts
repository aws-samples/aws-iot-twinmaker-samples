// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
// SPDX-License-Identifier: Apache-2.0

import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';

export type AwsCredentials = {
  accessKeyId: string;
  expiration: Date;
  region: string;
  secretAccessKey: string;
  sessionToken?: string;
  username: string;
};

export type AuthenticatedUserConfig = CognitoAuthenticatedFlowConfig & {
  password: string;
  username: string;
};

export type CognitoAuthenticatedFlowConfig = UnauthenticatedUserConfig & {
  clientId: string;
  userPoolId: string;
};

export type UnauthenticatedUserConfig = {
  identityPoolId: string;
  region: string;
};

/**
 * Get AWS credentials using Cognito authenticated user flow.
 */
export function getAwsCredentials(config: AuthenticatedUserConfig): Promise<AwsCredentials>;
/**
 * Get AWS credentials using Cognito unauthenticated user flow.
 */
export function getAwsCredentials(config: UnauthenticatedUserConfig): Promise<AwsCredentials>;
export function getAwsCredentials(arg: AuthenticatedUserConfig | UnauthenticatedUserConfig) {
  if (isAuthenticatedUserConfig(arg)) return getAuthenticatedUserCredentials(arg);
  return getUserCredentials(arg);
}

function getAuthenticatedUserCredentials({
  clientId,
  identityPoolId,
  password,
  region,
  username,
  userPoolId
}: AuthenticatedUserConfig) {
  const userPool = new CognitoUserPool({
    ClientId: clientId,
    UserPoolId: userPoolId
  });

  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password
  });

  return new Promise<AwsCredentials>((resolve, reject) => {
    new CognitoUser({
      Username: username,
      Pool: userPool
    }).authenticateUser(authenticationDetails, {
      onFailure: (err) => reject(err),
      onSuccess: (result) => {
        getUserCredentials({ identityPoolId, region }, result.getIdToken().getJwtToken(), userPoolId)
          .then((credentials) => resolve({ ...credentials, username }))
          .catch((err) => reject(new Error(err)));
      }
    });
  });
}

async function getUserCredentials(
  { identityPoolId, region }: UnauthenticatedUserConfig,
  cognitoIdToken?: string,
  userPoolId?: string
) {
  let logins: Record<string, string> | undefined;

  if (cognitoIdToken && userPoolId) {
    logins = {
      [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: cognitoIdToken
    };
  }

  const provider = fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region }),
    identityPoolId,
    logins
  });

  const { accessKeyId, expiration, secretAccessKey, sessionToken } = await provider();

  return {
    accessKeyId,
    expiration: expiration ?? new Date(0),
    region,
    secretAccessKey,
    sessionToken
  };
}

function isAuthenticatedUserConfig(
  config: AuthenticatedUserConfig | UnauthenticatedUserConfig
): config is AuthenticatedUserConfig {
  const keys: (keyof AuthenticatedUserConfig)[] = [
    'clientId',
    'identityPoolId',
    'password',
    'region',
    'userPoolId',
    'username'
  ];
  for (const key of keys) {
    if (!Object.keys(config).includes(key)) return false;
  }
  return true;
}
