import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetAnnouncementsQuerySchema, AnnouncementCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "announcements.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, status, priority, sortBy, sortOrder } =
      GetAnnouncementsQuerySchema.parse(searchParams);

    const where: Prisma.AnnouncementWhereInput = {};

    if (search) {
      where.OR = [
        { titleEn: { contains: search, mode: "insensitive" } },
        { titleZh: { contains: search, mode: "insensitive" } },
        { contentEn: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [data, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "announcements.create");

    const body = await request.json();
    const validated = AnnouncementCreateSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        titleEn: validated.titleEn,
        titleZh: validated.titleZh,
        contentEn: validated.contentEn,
        contentZh: validated.contentZh,
        priority: validated.priority,
        audience: validated.audience,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        isPinned: validated.isPinned,
        status: validated.status,
        createdBy: user.id,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "announcement",
      resourceId: announcement.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating announcement:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
