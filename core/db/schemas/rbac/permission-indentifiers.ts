export type Entity = "app" | "oauth_app_client_secret";
export type Action = "create" | "read" | "update" | "delete" | "all";

export type PermissionIdentifier = `${Entity}:${Action}`;
