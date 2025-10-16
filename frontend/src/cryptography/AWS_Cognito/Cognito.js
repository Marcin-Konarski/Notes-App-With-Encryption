// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { CognitoIdentityProviderClient, InitiateAuthCommand, SignUpCommand, ConfirmSignUpCommand, DeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";

import { makeCognitoPasswordHash } from "@/cryptography/hashing/CreateHash";
import config from "@/cryptography/AWS_Cognito/Config";


const cognitoClient = new CognitoIdentityProviderClient({
  region: config.region,
});

const cognitoSignIn = async (username, password) => {
  const secretHash = await makeCognitoPasswordHash(username);

  const params = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config.clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
      SECRET_HASH: secretHash,
    },
  };
  try {
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await cognitoClient.send(command);
    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || "");
      sessionStorage.setItem(
        "accessToken",
        AuthenticationResult.AccessToken || "",
      );
      sessionStorage.setItem(
        "refreshToken",
        AuthenticationResult.RefreshToken || "",
      );
      return AuthenticationResult;
    }
  } catch (error) {
    console.error("Error signing in: ", error);
    throw error;
  }
};

const cognitoSignUp = async (email, username, password) => {
  const secretHash = await makeCognitoPasswordHash(username);

  const params = {
    ClientId: config.clientId,
    Username: username,
    Password: password,
    SecretHash: secretHash,
    UserAttributes: [
      {
        Name: "email",
        Value: email,
      },
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

const confirmCognitoSignUp = async (username, code) => {
  const secretHash = await makeCognitoPasswordHash(username);

  const params = {
    ClientId: config.clientId,
    Username: username,
    ConfirmationCode: code,
    SecretHash: secretHash,
  };
  try {
    const command = new ConfirmSignUpCommand(params);
    await cognitoClient.send(command);
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};

const cognitoRefreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem("refreshToken");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const params = {
    AuthFlow: "REFRESH_TOKEN_AUTH",
    ClientId: config.clientId,
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  };

  try {
    const command = new InitiateAuthCommand(params);
    const { AuthenticationResult } = await cognitoClient.send(command);

    if (AuthenticationResult) {
      sessionStorage.setItem("idToken", AuthenticationResult.IdToken || "");
      sessionStorage.setItem("accessToken", AuthenticationResult.AccessToken || "");

      return AuthenticationResult;
    }
  } catch (error) {
    console.error("Error refreshing token:", error);
    throw error;
  }
};

const cognitoDeleteUser = async () => {
  let accessToken = sessionStorage.getItem("accessToken");

  if (!accessToken) {
    await cognitoRefreshAccessToken();
    accessToken = sessionStorage.getItem("accessToken");
  }

  const params = {
    AccessToken: accessToken,
  };
  try {
    const command = new DeleteUserCommand(params);
    await cognitoClient.send(command);
    return true;
  } catch (error) {
    console.error("Error confirming sign up: ", error);
    throw error;
  }
};

export { cognitoClient, cognitoSignIn, cognitoSignUp, confirmCognitoSignUp, cognitoRefreshAccessToken, cognitoDeleteUser }