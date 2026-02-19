import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

// GET - get session details (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await prisma.translationSession.findUnique({
      where: { id },
      include: { _count: { select: { entries: true } } },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - end session (auth required)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();
    await requirePermission(user.id, "translation.operate");

    const { id } = await params;

    const session = await prisma.translationSession.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "ENDED") {
      return NextResponse.json({ error: "Session already ended" }, { status: 400 });
    }

    const updated = await prisma.translationSession.update({
      where: { id },
      data: { status: "ENDED", endedAt: new Date() },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "translation_session",
      resourceId: id,
      oldValues: { status: session.status },
      newValues: { status: "ENDED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error ending session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
