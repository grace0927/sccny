import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "roles.assign");

    const { id, userId } = await params;

    const userRole = await prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId: id } },
    });

    if (!userRole) {
      return NextResponse.json({ error: "User role not found" }, { status: 404 });
    }

    await prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId: id } },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "DELETE",
      resourceType: "user_role",
      resourceId: userRole.id,
      oldValues: { userId, roleId: id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error removing user from role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
