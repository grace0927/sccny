import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { WorshipOrderUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.view");

    const { id } = await params;
    const order = await prisma.worshipOrder.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Worship order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching worship order:", error);
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

    await requirePermission(user.id, "ppt.edit");

    const { id } = await params;
    const existing = await prisma.worshipOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Worship order not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = WorshipOrderUpdateSchema.parse(body);

    const order = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (validated.name) updateData.name = validated.name;
      if (validated.date) updateData.date = new Date(validated.date);
      if (validated.templateId !== undefined) updateData.templateId = validated.templateId || null;

      await tx.worshipOrder.update({
        where: { id },
        data: updateData,
      });

      // Replace items if provided
      if (validated.items) {
        await tx.worshipOrderItem.deleteMany({ where: { orderId: id } });
        if (validated.items.length > 0) {
          await tx.worshipOrderItem.createMany({
            data: validated.items.map((item) => ({
              orderId: id,
              type: item.type,
              sortOrder: item.sortOrder,
              title: item.title || null,
              titleZh: item.titleZh || null,
              content: item.content || null,
              contentZh: item.contentZh || null,
              hymnId: item.hymnId || null,
              scriptureRef: item.scriptureRef || null,
            })),
          });
        }
      }

      return tx.worshipOrder.findUnique({
        where: { id },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      });
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "worship_order",
      resourceId: id,
      oldValues: { name: existing.name, itemCount: existing.items.length },
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating worship order:", error);
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

    await requirePermission(user.id, "ppt.delete");

    const { id } = await params;
    const existing = await prisma.worshipOrder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Worship order not found" }, { status: 404 });
    }

    await prisma.worshipOrder.delete({ where: { id } });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "DELETE",
      resourceType: "worship_order",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error deleting worship order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
