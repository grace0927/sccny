import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { retryJob } from "@/lib/worship-email-ingest";

/** POST /api/admin/ppt/jobs/[id]/retry — re-run parse + generate for a failed job. */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const { id } = await params;

    await retryJob(id);

    const job = await prisma.worshipSlideJob.findUnique({ where: { id } });
    return NextResponse.json({ data: job });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error retrying worship slide job:", error);
    // `retryJob` already persisted the failure on the job row; surface the
    // reason so the operator sees it without reloading.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Retry failed" },
      { status: 500 }
    );
  }
}
