import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { MemberApproveSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.approve");

    const { id } = await params;
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.status !== "PENDING") {
      return NextResponse.json({ error: "Member is not in PENDING status" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { fellowshipGroup } = MemberApproveSchema.parse(body);

    const updated = await prisma.member.update({
      where: { id },
      data: {
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: new Date(),
        ...(fellowshipGroup ? { fellowshipGroup } : {}),
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "APPROVE",
      resourceType: "member",
      resourceId: id,
      oldValues: { status: "PENDING" },
      newValues: { status: "ACTIVE", fellowshipGroup },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error approving member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
