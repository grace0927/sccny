import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { RoleCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "roles.view");

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: roles });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "roles.create");

    const body = await request.json();
    const validated = RoleCreateSchema.parse(body);

    const role = await prisma.role.create({
      data: {
        name: validated.name,
        description: validated.description,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "role",
      resourceId: role.id,
      newValues: validated as Record<string, unknown>,
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
