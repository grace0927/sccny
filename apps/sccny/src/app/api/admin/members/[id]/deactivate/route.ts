import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.deactivate");

    const { id } = await params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Member is not in ACTIVE status" }, { status: 400 });
    }

    const updated = await prisma.member.update({
      where: { id },
      data: { status: "INACTIVE" },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "DEACTIVATE",
      resourceType: "member",
      resourceId: id,
      oldValues: { status: "ACTIVE" },
      newValues: { status: "INACTIVE" },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error deactivating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
