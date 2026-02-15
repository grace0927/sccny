import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetAdminSermonsQuerySchema, SermonAdminCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "sermons.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, speaker, series, type, sortBy, sortOrder } =
      GetAdminSermonsQuerySchema.parse(searchParams);

    const where: Prisma.SermonWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { speaker: { contains: search, mode: "insensitive" } },
        { scripture: { contains: search, mode: "insensitive" } },
      ];
    }
    if (speaker) where.speaker = { contains: speaker, mode: "insensitive" };
    if (series) where.series = { contains: series, mode: "insensitive" };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      prisma.sermon.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sermon.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching sermons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "sermons.create");

    const body = await request.json();
    const validated = SermonAdminCreateSchema.parse(body);

    const sermon = await prisma.sermon.create({
      data: {
        title: validated.title,
        speaker: validated.speaker,
        date: new Date(validated.date),
        type: validated.type,
        series: validated.series || null,
        scripture: validated.scripture || null,
        description: validated.description || null,
        videoUrl: validated.videoUrl || null,
        audioUrl: validated.audioUrl || null,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "sermon",
      resourceId: sermon.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(sermon, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating sermon:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
