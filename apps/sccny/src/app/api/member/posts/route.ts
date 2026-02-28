import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { CommunityPostCreateSchema, GetCommunityPostsQuerySchema } from "@/lib/admin-validations";
async function getActiveMember(userId: string) {
  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member || member.status !== "ACTIVE") return null;
  return member;
}

export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await getActiveMember(user.id);
    if (!member) return NextResponse.json({ error: "Active membership required" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const query = GetCommunityPostsQuerySchema.parse(Object.fromEntries(searchParams));

    const skip = (query.page - 1) * query.limit;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, name: true, nameZh: true, profilePhoto: true } },
        },
      }),
      prisma.communityPost.count(),
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
    console.error("Error fetching community posts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await getActiveMember(user.id);
    if (!member) return NextResponse.json({ error: "Active membership required" }, { status: 403 });

    const body = await request.json();
    const validated = CommunityPostCreateSchema.parse(body);

    // Read configurable max length from SystemConfig (default 150)
    const config = await prisma.systemConfig.findUnique({ where: { key: "post_max_length" } });
    const maxLength = config ? parseInt(config.value) : 150;

    if (validated.content.length > maxLength) {
      return NextResponse.json(
        { error: `Post content exceeds the maximum of ${maxLength} characters` },
        { status: 400 }
      );
    }

    const post = await prisma.communityPost.create({
      data: {
        memberId: member.id,
        content: validated.content,
        imageUrl: validated.imageUrl,
        imageFileId: validated.imageFileId,
      },
      include: {
        member: { select: { id: true, name: true, nameZh: true, profilePhoto: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating community post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
