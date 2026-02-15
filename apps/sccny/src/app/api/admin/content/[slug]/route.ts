import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { ContentPageUpdateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "content.view");

    const { slug } = await params;
    const page = await prisma.contentPage.findUnique({
      where: { slug },
      include: { revisions: { orderBy: { createdAt: "desc" }, take: 10 } },
    });

    if (!page) {
      return NextResponse.json({ error: "Content page not found" }, { status: 404 });
    }

    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching content page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "content.edit");

    const { slug } = await params;
    const existing = await prisma.contentPage.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Content page not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = ContentPageUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...validated };
    if (validated.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
      updateData.publishedAt = new Date();
    }

    const page = await prisma.contentPage.update({
      where: { slug },
      data: updateData,
    });

    // Create a revision for this edit
    await prisma.contentRevision.create({
      data: {
        pageId: page.id,
        titleEn: page.titleEn,
        titleZh: page.titleZh,
        contentEn: page.contentEn,
        contentZh: page.contentZh,
        editedById: user.id,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "content",
      resourceId: page.id,
      oldValues: { titleEn: existing.titleEn, titleZh: existing.titleZh, status: existing.status },
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating content page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
