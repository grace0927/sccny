import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { MemberUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.view");

    const { id } = await params;
    const member = await prisma.member.findUnique({ where: { id } });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching member:", error);
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

    await requirePermission(user.id, "members.edit");

    const { id } = await params;
    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = MemberUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.nameZh !== undefined) updateData.nameZh = validated.nameZh;
    if (validated.email !== undefined) updateData.email = validated.email || null;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.address !== undefined) updateData.address = validated.address;
    if (validated.birthday !== undefined) updateData.birthday = validated.birthday ? new Date(validated.birthday) : null;
    if (validated.baptismDate !== undefined) updateData.baptismDate = validated.baptismDate ? new Date(validated.baptismDate) : null;
    if (validated.memberSince !== undefined) updateData.memberSince = validated.memberSince ? new Date(validated.memberSince) : null;
    if (validated.fellowshipGroup !== undefined) updateData.fellowshipGroup = validated.fellowshipGroup;
    if (validated.ministryAssignments !== undefined) updateData.ministryAssignments = validated.ministryAssignments;

    const updated = await prisma.member.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "member",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: validated as Record<string, unknown>,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
