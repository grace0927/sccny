import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { PptTemplateUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "templates.edit");

    const { id } = await params;
    const existing = await prisma.pptTemplate.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = PptTemplateUpdateSchema.parse(body);

    // If this is set as default, unset other defaults
    if (validated.isDefault) {
      await prisma.pptTemplate.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.backgroundImage === "") updateData.backgroundImage = null;

    const template = await prisma.pptTemplate.update({
      where: { id },
      data: updateData,
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "ppt_template",
      resourceId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
