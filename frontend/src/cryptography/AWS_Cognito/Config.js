export const config = {
  region: import.meta.env.VITE_IDENTITY_REGION,
  identityPoolId: import.meta.env.VITE_IDENTITY_POOL_ID,
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

export default config;