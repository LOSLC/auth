import * as pg from "drizzle-orm/pg-core";
import type { PermissionIdentifier } from "./permission-indentifiers";
import { user } from "../auth/schemas";

export const role = pg.pgTable("roles", {
  id: pg.uuid("id").primaryKey().defaultRandom().notNull(),
  description: pg.text("description"),
  createdAt: pg.timestamp("created_at").defaultNow().notNull(),
  updatedAt: pg
    .timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const permission = pg.pgTable("permissions", {
  id: pg.uuid("id").primaryKey().defaultRandom().notNull(),
  identifier: pg.text("identifier").$type<PermissionIdentifier>().notNull(),
  entityId: pg.text("entity_id").notNull(),
});

export const rolePermissions = pg.pgTable("role_permissions", {
  roleId: pg
    .uuid("role_id")
    .references(() => role.id, { onDelete: "cascade" })
    .notNull(),
  permissionId: pg
    .uuid("permission_id")
    .references(() => permission.id, { onDelete: "cascade" })
    .notNull(),
});

export const userRoles = pg.pgTable("user_roles", {
  userId: pg
    .text("user_id")
    .references((): pg.AnyPgColumn => user.id, { onDelete: "cascade" })
    .notNull(),
  roleId: pg
    .uuid("role_id")
    .references(() => role.id, { onDelete: "cascade" })
    .notNull(),
});
