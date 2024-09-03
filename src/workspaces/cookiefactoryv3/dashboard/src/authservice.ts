// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import type { AuthenticationResultType } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, 
  ConfirmSignUpCommand, GetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import appConfig from './app.config';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: appConfig.cognito.region,
});

function getCurrentCognitoUser(): CognitoUser | null {
  const userPool = new CognitoUserPool({
    UserPoolId: appConfig.cognito.userPoolId,
    ClientId: appConfig.cognito.clientId,
  });

  // This method checks for tokens in localStorage or sessionStorage
  return userPool.getCurrentUser();
}

export function logOutUser() {
  const currentUser = getCurrentCognitoUser();

  if (currentUser) {
    currentUser.signOut(); // Sign out the specific user from Cognito

    // Clear only the tokens related to the specific user
    sessionStorage.removeItem(`accessToken`);
    sessionStorage.removeItem(`idToken`);
    sessionStorage.removeItem(`refreshToken`);
   
  } else {
    console.log("No user is currently logged in.");
  }
}

async function getUserAttributes(accessToken: string) {
  const command = new GetUserCommand({ AccessToken: accessToken });

  try {
    const response = await cognitoClient.send(command);

    // Extract user attributes into a key-value object
    const attributes: { [key: string]: string } = {};
    response.UserAttributes?.forEach(attribute => {
      if (attribute.Name) {  
        attributes[attribute.Name] = attribute.Value || ''; 
      }
    });

    return attributes;
  } catch (error) {
    console.error("Failed to retrieve user attributes:", error);
    throw error;
  }
}

export const signIn = async (username: string, password: string): Promise<{ AuthenticationResult: AuthenticationResultType, UserAttributes: { [key: string]: string } }> => {
  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: appConfig.cognito.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const response = await cognitoClient.send(command);

    if (response.AuthenticationResult) {
      const accessToken = response.AuthenticationResult.AccessToken || '';

      sessionStorage.setItem("idToken", response.AuthenticationResult.IdToken || '');
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("refreshToken", response.AuthenticationResult.RefreshToken || '');

      const UserAttributes = await getUserAttributes(accessToken);

      return { AuthenticationResult: response.AuthenticationResult, UserAttributes };
    } else {
      throw new Error("Authentication failed, no AuthenticationResult found.");
    }
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

export const signUp = async (email: string, name: string, password: string) => {
  const params = {
    ClientId: appConfig.cognito.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
      {
        Name: "name",
        Value: name,
      },
      {
        Name: "custom:title",
        Value: "Line Operator",
      }
    ],
  };
  try {
    const command = new SignUpCommand(params);
    const response = await cognitoClient.send(command);

    return response;
  } catch (error) {
    console.error("Error signing up: ", error);
    throw error;
  }
};

export const confirmSignUp = async (username: string, code: string) => {
  const params = {
    ClientId: appConfig.cognito.clientId,
    Username: username,
    ConfirmationCode: code,
  };
  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    console.log("User confirmed successfully");
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};