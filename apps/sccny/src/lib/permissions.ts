import "server-only";
import { prisma } from "@/lib/db";

export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissionSet = new Set<string>();
  for (const ur of userRoles) {
    for (const rp of ur.role.permissions) {
      permissionSet.add(rp.permission.key);
    }
  }

  return Array.from(permissionSet);
}

export async function hasPermission(
  userId: string,
  permissionKey: string
): Promise<boolean> {
  const count = await prisma.rolePermission.count({
    where: {
      permission: { key: permissionKey },
      role: {
        users: { some: { userId } },
      },
    },
  });
  return count > 0;
}

export async function requirePermission(
  userId: string,
  permissionKey: string
): Promise<void> {
  const allowed = await hasPermission(userId, permissionKey);
  if (!allowed) {
    throw new PermissionError(`Missing permission: ${permissionKey}`);
  }
}

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}
