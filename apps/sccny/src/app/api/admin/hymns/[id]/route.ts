import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { HymnUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "hymns.view");

    const { id } = await params;
    const hymn = await prisma.hymn.findUnique({ where: { id } });
    if (!hymn) {
      return NextResponse.json({ error: "Hymn not found" }, { status: 404 });
    }

    return NextResponse.json(hymn);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching hymn:", error);
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

    await requirePermission(user.id, "hymns.edit");

    const { id } = await params;
    const existing = await prisma.hymn.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hymn not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = HymnUpdateSchema.parse(body);

    const hymn = await prisma.hymn.update({
      where: { id },
      data: validated,
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "hymn",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(hymn);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating hymn:", error);
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

    await requirePermission(user.id, "hymns.delete");

    const { id } = await params;
    const existing = await prisma.hymn.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hymn not found" }, { status: 404 });
    }

    await prisma.hymn.delete({ where: { id } });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "DELETE",
      resourceType: "hymn",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error deleting hymn:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
