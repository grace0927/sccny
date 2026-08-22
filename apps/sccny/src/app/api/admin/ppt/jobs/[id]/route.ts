import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

/** GET /api/admin/ppt/jobs/[id] — one job (used to prefill the PPT wizard). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const { id } = await params;
    const job = await prisma.worshipSlideJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: job });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching worship slide job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** PATCH /api/admin/ppt/jobs/[id] — mark a generated deck as reviewed. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const { id } = await params;
    const body = await request.json();

    if (body?.status !== "REVIEWED") {
      return NextResponse.json(
        { error: 'Only { status: "REVIEWED" } is supported' },
        { status: 400 }
      );
    }

    const existing = await prisma.worshipSlideJob.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "GENERATED") {
      return NextResponse.json(
        { error: "Only a generated deck can be marked reviewed" },
        { status: 400 }
      );
    }

    const job = await prisma.worshipSlideJob.update({
      where: { id },
      data: {
        status: "REVIEWED",
        reviewedBy: user.displayName ?? user.primaryEmail ?? user.id,
        reviewedAt: new Date(),
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName ?? user.primaryEmail ?? "Unknown",
      action: "APPROVE",
      resourceType: "WorshipSlideJob",
      resourceId: job.id,
      newValues: { status: "REVIEWED", presentationId: job.presentationId },
    });

    return NextResponse.json({ data: job });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error updating worship slide job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** DELETE /api/admin/ppt/jobs/[id] — drop a job row (the Drive deck is untouched). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const { id } = await params;
    const existing = await prisma.worshipSlideJob.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.worshipSlideJob.delete({ where: { id } });

    await logAction({
      userId: user.id,
      userName: user.displayName ?? user.primaryEmail ?? "Unknown",
      action: "DELETE",
      resourceType: "WorshipSlideJob",
      resourceId: id,
      oldValues: {
        emailSubject: existing.emailSubject,
        presentationId: existing.presentationId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error deleting worship slide job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
