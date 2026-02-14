import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { RolePermissionsUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "roles.edit");

    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
      include: { permissions: true },
    });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await request.json();
    const { permissionIds } = RolePermissionsUpdateSchema.parse(body);

    const oldPermissionIds = role.permissions.map((rp) => rp.permissionId);

    // Replace all permissions
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId,
        })),
      }),
    ]);

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "role_permissions",
      resourceId: id,
      oldValues: { permissionIds: oldPermissionIds },
      newValues: { permissionIds },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating role permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
