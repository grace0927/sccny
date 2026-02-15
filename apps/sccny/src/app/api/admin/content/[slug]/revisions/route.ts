import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "content.view");

    const { slug } = await params;
    const page = await prisma.contentPage.findUnique({ where: { slug } });
    if (!page) {
      return NextResponse.json({ error: "Content page not found" }, { status: 404 });
    }

    const revisions = await prisma.contentRevision.findMany({
      where: { pageId: page.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: revisions });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching revisions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
