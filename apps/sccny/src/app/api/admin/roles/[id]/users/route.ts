import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { RoleUserAssignSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "roles.assign");

    const { id } = await params;
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    const body = await request.json();
    const { userId } = RoleUserAssignSchema.parse(body);

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId: id,
        assignedBy: user.id,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "user_role",
      resourceId: userRole.id,
      newValues: { userId, roleId: id, roleName: role.name },
    });

    return NextResponse.json(userRole, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error assigning user to role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
