import type { OAuthApp } from "@/core/db/schemas";
import type { AuthorizationScopes } from "@/lib/types/auth";

export interface OAuthAppCreationPayload {
  appName: string;
  description?: string;
  url: string;
  logoUrl?: string;
  supportEmail?: string;
  scopes: AuthorizationScopes[];
  redirectUris: string[];
}

export interface OAuthAppCreationResponse {
  app: OAuthApp;
  clientSecret: string;
}

export interface OAuthJWT {
  iss: string; // issuer
  sub: string; // user id
  aud: string; // client url
  iat: number;
  exp: number;
  jti: string;
  client_id: string;
  scope: string[];
}
