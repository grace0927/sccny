import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { stackServerApp } from "@/stack/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "users.view");

    const { id } = await params;
    const stackUser = await stackServerApp.getUser(id);
    if (!stackUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const member = await prisma.member.findUnique({
      where: { userId: id },
      select: { id: true, status: true, name: true },
    });

    const userRoles = await prisma.userRole.findMany({
      where: { userId: id },
      include: { role: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      data: {
        id: stackUser.id,
        displayName: stackUser.displayName,
        primaryEmail: stackUser.primaryEmail,
        createdAt: stackUser.createdAtMillis ? new Date(stackUser.createdAtMillis).toISOString() : null,
        member: member || null,
        roles: userRoles.map((ur) => ur.role),
      },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
