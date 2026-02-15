import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "content.publish");

    const { slug } = await params;
    const existing = await prisma.contentPage.findUnique({ where: { slug } });
    if (!existing) {
      return NextResponse.json({ error: "Content page not found" }, { status: 404 });
    }

    const page = await prisma.contentPage.update({
      where: { slug },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "content",
      resourceId: page.id,
      oldValues: { status: existing.status },
      newValues: { status: "PUBLISHED" },
    });

    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error publishing content page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
