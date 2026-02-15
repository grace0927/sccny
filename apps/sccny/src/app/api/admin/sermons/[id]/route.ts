import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { SermonAdminUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "sermons.view");

    const { id } = await params;
    const sermon = await prisma.sermon.findUnique({ where: { id } });
    if (!sermon) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    return NextResponse.json(sermon);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching sermon:", error);
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

    await requirePermission(user.id, "sermons.edit");

    const { id } = await params;
    const existing = await prisma.sermon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = SermonAdminUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.date) updateData.date = new Date(validated.date);
    if (validated.videoUrl === "") updateData.videoUrl = null;
    if (validated.audioUrl === "") updateData.audioUrl = null;

    const sermon = await prisma.sermon.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "sermon",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(sermon);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating sermon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "sermons.delete");

    const { id } = await params;
    const existing = await prisma.sermon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    await prisma.sermon.delete({ where: { id } });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "DELETE",
      resourceType: "sermon",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error deleting sermon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
