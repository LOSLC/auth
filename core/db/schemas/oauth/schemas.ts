import { randNumericString, randString } from "@/core/utils/random";
import type { AuthorizationScopes } from "@/lib/types/auth";
import * as pg from "drizzle-orm/pg-core";
import { user } from "../auth/schemas";
import { addDays, addHours } from "date-fns";

const config = {
  REFRESH_TOKEN_EXPIRES_DAYS: 30,
  AUTHORIZATION_CODE_EXPIRES_HOURS: 1,
};

export const clientApp = pg.pgTable("client_app", {
  id: pg
    .text("id")
    .$defaultFn(() => randString(32))
    .primaryKey(),
  userId: pg
    .text("user_id")
    .references((): pg.AnyPgColumn => user.id, { onDelete: "cascade" })
    .notNull(),
  name: pg.text("name").notNull(),
  description: pg.text("description"),
  url: pg.text("url").notNull(),
  logoUrl: pg.text("logo_url"),
  supportEmail: pg.text("support_email"),
  createdAt: pg.timestamp("created_at").defaultNow().notNull(),
  redirectUris: pg.text("redirect_uris").array().notNull().default([]),
  updatedAt: pg
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  scopes: pg
    .jsonb("scopes")
    .$type<AuthorizationScopes[]>()
    .default([])
    .notNull(),
  clientId: pg
    .text("client_id")
    .$defaultFn(() => randString(128))
    .notNull()
    .unique(),
});

export const appUsers = pg.pgTable("app_users", {
  appId: pg
    .text()
    .references((): pg.AnyPgColumn => clientApp.id, { onDelete: "cascade" })
    .notNull(),
  userId: pg
    .text()
    .references((): pg.AnyPgColumn => user.id, { onDelete: "cascade" })
    .notNull(),
  authorizedAt: pg.timestamp("authorized_at").defaultNow().notNull(),
});

export const authorizationCode = pg.pgTable("authorization_code", {
  id: pg
    .text("id")
    .$defaultFn(() => randString(32))
    .notNull()
    .primaryKey(),
  code: pg
    .text("code")
    .$defaultFn(() => randNumericString(64))
    .notNull()
    .unique(),
  appId: pg
    .text("app_id")
    .references((): pg.AnyPgColumn => clientApp.id, { onDelete: "cascade" })
    .notNull(),
  userId: pg
    .text("user_id")
    .references((): pg.AnyPgColumn => user.id, { onDelete: "cascade" })
    .notNull(),
  issuedAt: pg.timestamp("issued_at").defaultNow().notNull(),
  expiresAt: pg
    .timestamp("expires_at")
    .$defaultFn(() =>
      addHours(new Date(), config.AUTHORIZATION_CODE_EXPIRES_HOURS),
    )
    .notNull(),
});

export const refreshToken = pg.pgTable("refresh_token", {
  id: pg
    .text("id")
    .$defaultFn(() => randString(64))
    .primaryKey()
    .notNull(),
  userId: pg
    .text("user_id")
    .references((): pg.AnyPgColumn => user.id, { onDelete: "cascade" })
    .notNull(),
  token: pg.text("token").notNull().unique(),
  appId: pg
    .text("app_id")
    .references((): pg.AnyPgColumn => clientApp.id, { onDelete: "cascade" })
    .notNull(),
  issuedAt: pg.timestamp("issued_at").defaultNow().notNull(),
  expiresAt: pg
    .timestamp("expires_at")
    .$defaultFn(() => addDays(new Date(), config.REFRESH_TOKEN_EXPIRES_DAYS))
    .notNull(),
  revokedAt: pg.timestamp("revoked_at"),
});

export const appClientSecret = pg.pgTable("app_client_secret", {
  id: pg
    .text("id")
    .$defaultFn(() => randString(32))
    .primaryKey()
    .notNull(),
  appId: pg
    .text("app_id")
    .references((): pg.AnyPgColumn => clientApp.id, { onDelete: "cascade" })
    .notNull(),
  hashedSecret: pg.text("hashed_secret").notNull(),
  createdAt: pg.timestamp("created_at").defaultNow().notNull(),
  expiresAt: pg.timestamp("expires_at"),
  revokedAt: pg.timestamp("revoked_at"),
});

export type OAuthApp = typeof clientApp.$inferSelect;
export type OAuthAuthorizationCode = typeof authorizationCode.$inferSelect;
export type OAuthRefreshToken = typeof refreshToken.$inferSelect;
