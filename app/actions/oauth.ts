"use server";

import { randString } from "@/core/utils/random";
import {
  authorizationCode,
  user as dbUser,
  refreshToken,
} from "@/core/db/schemas";
import type {
  OAuthAppCreationPayload,
  OAuthAppCreationResponse,
  OAuthJWT,
} from "./types.oauth";
import { generateJWT, hashString } from "@/core/utils/crypto";
import { db } from "@/core/db/setup";
import {
  appClientSecret,
  appUsers,
  clientApp,
  type OAuthApp,
} from "@/core/db/schemas";
import type { User } from "better-auth";
import type {
  PaginatedRequest,
  ServerResponse,
} from "@/lib/types/request-response";
import { createPermission, isAllowed } from "@/lib/rbac";
import { and, count, eq, gt, isNull, or } from "drizzle-orm";
import { getEnv } from "@/core/utils/env";
import { appConfig } from "@/core/config";

export async function createOAuthApp(
  user: User,
  payload: OAuthAppCreationPayload,
): Promise<ServerResponse<OAuthAppCreationResponse>> {
  try {
    const firstSecretKey = randString(32);
    const hashedSecret = await hashString(firstSecretKey);
    const [app] = await db
      .insert(clientApp)
      .values({
        name: payload.appName,
        userId: user.id,
        description: payload.description,
        logoUrl: payload.logoUrl,
        url: payload.url,
        scopes: payload.scopes,
        supportEmail: payload.supportEmail,
        redirectUris: payload.redirectUris,
      })
      .returning();

    const [clientSecret] = await db
      .insert(appClientSecret)
      .values({
        hashedSecret: hashedSecret,
        appId: app.id,
      })
      .returning();

    await createPermission({
      user,
      identifier: "app:all",
      entityId: app.id,
    });

    await createPermission({
      user,
      identifier: "oauth_app_client_secret:all",
      entityId: clientSecret.id,
    });
    return {
      success: true,
      data: {
        app,
        clientSecret: firstSecretKey,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create OAuth app.",
    };
  }
}

export async function updateApp({
  appId,
  payload,
  user,
}: {
  appId: string;
  user: User;
  payload: Pick<
    Partial<OAuthApp>,
    "name" | "logoUrl" | "description" | "supportEmail" | "scopes" | "redirectUris"
  >;
}): Promise<ServerResponse<OAuthApp>> {
  if (
    !(await isAllowed({
      user,
      requiredPermissions: ["app:all", "app:update"],
      entityId: appId,
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to update this app.",
    };
  }
  const [app] = await db
    .update(clientApp)
    .set(payload)
    .where(eq(clientApp.id, appId))
    .returning();
  return {
    success: true,
    data: app,
  };
}

export async function generateNewClientSecret({
  appId,
  user,
}: {
  appId: string;
  user: User;
}): Promise<ServerResponse<{ clientSecret: string }>> {
  if (
    !(await isAllowed({
      user,
      requiredPermissions: ["app:all", "app:update"],
      entityId: appId,
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to update this app.",
    };
  }
  const newSecret = randString(32);
  const hashedSecret = await hashString(newSecret);
  const [app] = await db
    .select()
    .from(clientApp)
    .where(eq(clientApp.id, appId));
  if (!app) {
    return {
      success: false,
      message: "App not found.",
    };
  }
  const [clientSecret] = await db
    .insert(appClientSecret)
    .values({
      hashedSecret: hashedSecret,
      appId: appId,
    })
    .returning();
  createPermission({
    user,
    identifier: "oauth_app_client_secret:all",
    entityId: clientSecret.id,
  });
  return {
    success: true,
    data: { clientSecret: newSecret },
  };
}

export async function revokeClientSecret({
  appId,
  user,
  secretToRevoke: secretToRevokeId,
}: {
  appId: string;
  user: User;
  secretToRevoke: string;
}): Promise<ServerResponse<void>> {
  if (
    !(await isAllowed({
      user,
      requiredPermissions: ["app:all", "app:update"],
      entityId: appId,
    })) ||
    !(await isAllowed({
      user,
      entityId: secretToRevokeId,
      requiredPermissions: [
        "oauth_app_client_secret:all",
        "oauth_app_client_secret:delete",
      ],
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to revoke this client secret.",
    };
  }
  await db
    .update(appClientSecret)
    .set({ revokedAt: new Date() })
    .where(eq(appClientSecret.id, secretToRevokeId));
  return {
    success: true,
    data: undefined,
    message: "Client secret revoked successfully.",
  };
}

export async function getOAuthApp({
  appId,
  user,
}: {
  appId: string;
  user: User;
}): Promise<ServerResponse<OAuthApp>> {
  if (
    !(await isAllowed({
      user,
      requiredPermissions: ["app:all"],
      entityId: appId,
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to view this app.",
    };
  }
  const [app] = await db
    .select()
    .from(clientApp)
    .where(eq(clientApp.id, appId));

  if (!app) {
    return {
      success: false,
      message: "App not found.",
    };
  }

  return {
    success: true,
    data: app,
  };
}

export async function listOAuthApps({
  user,
  payload,
}: {
  user: User;
  payload: PaginatedRequest<{ query?: string }>;
}): Promise<ServerResponse<OAuthApp[]>> {
  const apps = await db
    .select()
    .from(clientApp)
    .where(eq(clientApp.userId, user.id))
    .limit(payload.limit ?? 10)
    .offset(payload.offset ?? 0);

  return {
    success: true,
    data: apps,
  };
}

export async function deleteOAuthApp({
  appId,
  user,
}: {
  appId: string;
  user: User;
}): Promise<ServerResponse<void>> {
  if (
    !(await isAllowed({
      user,
      requiredPermissions: ["app:all"],
      entityId: appId,
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to delete this app.",
    };
  }
  await db.delete(clientApp).where(eq(clientApp.id, appId));
  return {
    success: true,
    data: undefined,
    message: "App deleted successfully.",
  };
}

export async function countUserOAuthApps(
  user: User,
): Promise<ServerResponse<number>> {
  const [c] = await db
    .select({ count: count() })
    .from(clientApp)
    .where(eq(clientApp.userId, user.id));
  return {
    success: true,
    data: c.count,
  };
}

export async function listOAuthAppUsers(
  d: PaginatedRequest<{ appId: string; user: User }>,
): Promise<ServerResponse<User[]>> {
  const { appId, user } = d.data;
  if (
    !(await isAllowed({
      user: user,
      requiredPermissions: ["app:all"],
      entityId: appId,
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to view this app's users.",
    };
  }
  const oauthAppUsers = await db
    .select()
    .from(dbUser)
    .innerJoin(appUsers, eq(appUsers.userId, dbUser.id))
    .innerJoin(clientApp, eq(appUsers.appId, clientApp.id));
  return {
    success: true,
    data: oauthAppUsers.map((u) => u.user),
  };
}

export async function generateAuthorizationCode({
  user,
  clientId,
}: { user: User; clientId: string }): Promise<
  ServerResponse<{ code: string }>
> {
  const [app] = await db
    .select()
    .from(clientApp)
    .where(eq(clientApp.clientId, clientId));
  if (!app) {
    return {
      success: false,
      message: "Invalid client Id.",
    };
  }
  const [code] = await db
    .insert(authorizationCode)
    .values({
      appId: app.id,
      userId: user.id,
    })
    .returning();
  return {
    success: true,
    data: { code: code.code },
  };
}

export async function authorizeOAuthApp({
  code,
  clientId,
  clientSecret,
  offline,
}: {
  code: string;
  clientId: string;
  clientSecret: string;
  offline: boolean;
}): Promise<
  ServerResponse<{
    clientId: string;
    refreshToken?: string;
    accessToken: string;
  }>
> {
  const [app] = await db
    .select()
    .from(clientApp)
    .where(eq(clientApp.clientId, clientId));
  if (!app) {
    return {
      success: false,
      message: "Invalid client Id.",
    };
  }
  const [secret] = await db
    .select()
    .from(appClientSecret)
    .where(
      and(
        eq(appClientSecret.hashedSecret, await hashString(clientSecret)),
        eq(appClientSecret.appId, app.id),
        or(
          gt(appClientSecret.expiresAt, new Date()),
          isNull(appClientSecret.expiresAt),
        ),
        isNull(appClientSecret.revokedAt),
      ),
    );
  const [authCode] = await db
    .select()
    .from(authorizationCode)
    .where(
      and(
        eq(authorizationCode.code, code),
        eq(authorizationCode.appId, app.id),
        gt(authorizationCode.expiresAt, new Date()),
      ),
    );
  if (!secret || !authCode) {
    return {
      success: false,
      message: "Invalid secret or code",
    };
  }
  const accessTokenObject: OAuthJWT = {
    iss: getEnv("BETTER_AUTH_URL"),
    sub: authCode.userId,
    aud: app.url,
    iat: Date.now(),
    exp: Date.now() + appConfig.ACCESS_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    jti: randString(32),
    client_id: app.clientId,
    scope: app.scopes,
  };
  const accessTokenStr = await generateJWT(accessTokenObject);
  const response: {
    clientId: string;
    refreshToken?: string;
    accessToken: string;
  } = {
    clientId: app.id,
    accessToken: accessTokenStr,
  };
  if (offline) {
    const refreshTokenValue = randString(128);
    await db
      .insert(refreshToken)
      .values({
        appId: app.id,
        userId: authCode.userId,
        token: await hashString(refreshTokenValue),
      })
      .returning();
    response.refreshToken = refreshTokenValue;
  }
  return {
    success: true,
    data: response,
  };
}

export async function regenerateAccessToken({
  refreshToken: refreshTokenStr,
}: { refreshToken: string }): Promise<
  ServerResponse<{ accessToken: string; refreshToken: string }>
> {
  const [storedToken] = await db
    .select()
    .from(refreshToken)
    .where(eq(refreshToken.token, await hashString(refreshTokenStr)));
  if (!storedToken) {
    return {
      success: false,
      message: "Invalid refresh token.",
    };
  }
  if (storedToken.expiresAt < new Date() || storedToken.revokedAt !== null) {
    return {
      success: false,
      message: "Invalid refresh token.",
    };
  }
  const [app] = await db
    .select()
    .from(clientApp)
    .where(eq(clientApp.id, storedToken.appId));
  if (!app) {
    return {
      success: false,
      message: "Invalid refresh token.",
    };
  }
  const accessTokenObject: OAuthJWT = {
    iss: getEnv("BETTER_AUTH_URL"),
    sub: storedToken.userId,
    aud: app.url,
    iat: Date.now(),
    exp: Date.now() + appConfig.ACCESS_TOKEN_EXPIRES_MINUTES * 60 * 1000,
    jti: randString(32),
    client_id: app.clientId,
    scope: app.scopes,
  };
  const accessTokenStr = await generateJWT(accessTokenObject);
  const newRefreshTokenStr = randString(128);
  await db
    .insert(refreshToken)
    .values({
      appId: app.id,
      userId: storedToken.userId,
      token: await hashString(newRefreshTokenStr),
    })
    .returning();
  await db
    .update(refreshToken)
    .set({ revokedAt: new Date() })
    .where(eq(refreshToken.id, storedToken.id));
  return {
    success: true,
    data: {
      accessToken: accessTokenStr,
      refreshToken: newRefreshTokenStr,
    },
  };
}

export async function revokeRefreshToken({
  refreshToken: refreshTokenStr,
  user: appUser,
}: { refreshToken: string; user: User }): Promise<ServerResponse<void>> {
  const [storedToken] = await db
    .select()
    .from(refreshToken)
    .where(
      and(
        eq(refreshToken.token, await hashString(refreshTokenStr)),
        eq(refreshToken.userId, appUser.id),
      ),
    );
  if (!storedToken) {
    return {
      success: false,
      message: "Invalid refresh token.",
    };
  }
  await db
    .update(refreshToken)
    .set({ revokedAt: new Date() })
    .where(eq(refreshToken.id, storedToken.id));
  return {
    success: true,
    data: undefined,
    message: "Refresh token revoked successfully.",
  };
}

export async function listClientSecrets({
  appId,
  user,
}: {
  appId: string;
  user: User;
}): Promise<ServerResponse<typeof appClientSecret.$inferSelect[]>> {
  if (
    !(await isAllowed({
      user,
      requiredPermissions: ["app:all"],
      entityId: appId,
    }))
  ) {
    return {
      success: false,
      message: "You do not have permission to view this app's secrets.",
    };
  }
  const secrets = await db
    .select()
    .from(appClientSecret)
    .where(eq(appClientSecret.appId, appId));
  return {
    success: true,
    data: secrets,
  };
}

