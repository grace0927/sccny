import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { WorshipSlideJobStatus } from "@/generated/prisma";

const VALID_STATUSES = Object.values(WorshipSlideJobStatus) as string[];

/** GET /api/admin/ppt/jobs — list email-triggered slide jobs. */
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const status = searchParams.get("status");

    const where =
      status && VALID_STATUSES.includes(status)
        ? { status: status as WorshipSlideJobStatus }
        : {};

    const [data, total] = await Promise.all([
      prisma.worshipSlideJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.worshipSlideJob.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching worship slide jobs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
