import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetHymnsQuerySchema, HymnCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "hymns.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, category, sortBy, sortOrder } =
      GetHymnsQuerySchema.parse(searchParams);

    const where: Prisma.HymnWhereInput = {};

    if (search) {
      where.OR = [
        { titleEn: { contains: search, mode: "insensitive" } },
        { titleZh: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      prisma.hymn.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.hymn.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching hymns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "hymns.create");

    const body = await request.json();
    const validated = HymnCreateSchema.parse(body);

    const hymn = await prisma.hymn.create({
      data: {
        ...validated,
        createdBy: user.id,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "hymn",
      resourceId: hymn.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(hymn, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating hymn:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
