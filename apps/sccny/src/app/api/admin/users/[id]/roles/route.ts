import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { UserRoleUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "users.roles");

    const { id } = await params;
    const userRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: true },
    });

    return NextResponse.json({ data: userRoles.map((ur) => ur.role) });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching user roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "users.roles");

    const { id } = await params;
    const body = await request.json();
    const { roleIds } = UserRoleUpdateSchema.parse(body);

    // Get current roles for audit
    const oldRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: { select: { name: true } } },
    });

    // Replace all role assignments
    await prisma.userRole.deleteMany({ where: { userId: id } });
    if (roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId: id,
          roleId,
          assignedBy: user.id,
        })),
      });
    }

    const newRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: { select: { name: true } } },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "user_role",
      resourceId: id,
      oldValues: { roles: oldRoles.map((r) => r.role.name) },
      newValues: { roles: newRoles.map((r) => r.role.name) },
    });

    return NextResponse.json({ data: newRoles.map((ur) => ur.role) });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating user roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
