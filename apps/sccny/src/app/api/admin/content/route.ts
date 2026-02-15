import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetContentPagesQuerySchema, ContentPageCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "content.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, status, sortBy, sortOrder } =
      GetContentPagesQuerySchema.parse(searchParams);

    const where: Prisma.ContentPageWhereInput = {};

    if (search) {
      where.OR = [
        { slug: { contains: search, mode: "insensitive" } },
        { titleEn: { contains: search, mode: "insensitive" } },
        { titleZh: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.contentPage.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentPage.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching content pages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "content.edit");

    const body = await request.json();
    const validated = ContentPageCreateSchema.parse(body);

    const existing = await prisma.contentPage.findUnique({ where: { slug: validated.slug } });
    if (existing) {
      return NextResponse.json({ error: "A page with this slug already exists" }, { status: 409 });
    }

    const contentPage = await prisma.contentPage.create({
      data: {
        slug: validated.slug,
        titleEn: validated.titleEn,
        titleZh: validated.titleZh,
        contentEn: validated.contentEn,
        contentZh: validated.contentZh,
        status: validated.status,
        authorId: user.id,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
      },
    });

    // Create initial revision
    await prisma.contentRevision.create({
      data: {
        pageId: contentPage.id,
        titleEn: validated.titleEn,
        titleZh: validated.titleZh,
        contentEn: validated.contentEn,
        contentZh: validated.contentZh,
        editedById: user.id,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "content",
      resourceId: contentPage.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(contentPage, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating content page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
