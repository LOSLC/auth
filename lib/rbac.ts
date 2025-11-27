import type { PermissionIdentifier } from "@/core/db/schemas/rbac/permission-indentifiers";
import {
  permission,
  role,
  rolePermissions,
  userRoles,
} from "@/core/db/schemas/rbac/schemas";
import { db } from "@/core/db/setup";
import type { User } from "better-auth";
import { and, eq, inArray, or } from "drizzle-orm";

export async function isAllowed({
  user,
  requiredPermissions,
  entityId,
}: {
  user: User;
  requiredPermissions: PermissionIdentifier[];
  entityId: string;
}): Promise<boolean> {
  const [p] = await db
    .select()
    .from(permission)
    .where(
      and(
        or(inArray(permission.identifier, requiredPermissions)),
        eq(permission.entityId, entityId),
      ),
    )
    .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permission.id))
    .innerJoin(
      userRoles,
      and(
        eq(userRoles.roleId, rolePermissions.roleId),
        eq(userRoles.userId, user.id),
      ),
    );
  if (!p.permissions) {
    return false;
  }
  return true;
}

export async function createPermission({
  user,
  identifier,
  entityId,
}: { user: User; identifier: PermissionIdentifier; entityId: string }) {
  const [existingPermission] = await db
    .select()
    .from(permission)
    .where(eq(permission.identifier, identifier))
    .innerJoin(rolePermissions, eq(rolePermissions.permissionId, permission.id))
    .innerJoin(
      userRoles,
      and(
        eq(userRoles.roleId, rolePermissions.roleId),
        eq(userRoles.userId, user.id),
      ),
    );
  if (existingPermission.permissions) {
    return existingPermission.permissions;
  }
  const [newRole] = await db.insert(role).values({}).returning();
  const [newPermission] = await db
    .insert(permission)
    .values({
      identifier: identifier,
      entityId,
    })
    .returning();
  await db.insert(userRoles).values({
    userId: user.id,
    roleId: newRole.id,
  });
  await db.insert(rolePermissions).values({
    permissionId: newPermission.id,
    roleId: newRole.id,
  });
  return newPermission;
}
