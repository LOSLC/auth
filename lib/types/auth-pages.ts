export type AuthPageParams = {
  successRedirect?: string;
  errorRedirect?: string;
};

export type AuthorizationParams = {
  clientId: string;
  redirectURI: string;
  scopes?: string;
};
