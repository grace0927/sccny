import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetAdminCommunityPostsQuerySchema } from "@/lib/admin-validations";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "community.manage");

    const { searchParams } = new URL(request.url);
    const query = GetAdminCommunityPostsQuerySchema.parse(Object.fromEntries(searchParams));

    const where = query.memberId ? { memberId: query.memberId } : {};
    const skip = (query.page - 1) * query.limit;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, name: true, nameZh: true, email: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching community posts (admin):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
