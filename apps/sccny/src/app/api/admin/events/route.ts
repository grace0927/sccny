import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetEventsQuerySchema, EventCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "events.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, type, status, dateFrom, dateTo, sortBy, sortOrder } =
      GetEventsQuerySchema.parse(searchParams);

    const where: Prisma.EventWhereInput = {};

    if (search) {
      where.OR = [
        { titleEn: { contains: search, mode: "insensitive" } },
        { titleZh: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (dateFrom) where.startDate = { gte: new Date(dateFrom) };
    if (dateTo) where.endDate = { ...((where.endDate as object) || {}), lte: new Date(dateTo) };

    const [data, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: { _count: { select: { registrations: true } } },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching events:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "events.create");

    const body = await request.json();
    const validated = EventCreateSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        titleEn: validated.titleEn,
        titleZh: validated.titleZh,
        descriptionEn: validated.descriptionEn || null,
        descriptionZh: validated.descriptionZh || null,
        startDate: new Date(validated.startDate),
        endDate: new Date(validated.endDate),
        location: validated.location || null,
        type: validated.type,
        isRecurring: validated.isRecurring,
        recurrenceRule: validated.recurrenceRule || null,
        registrationUrl: validated.registrationUrl || null,
        coverImage: validated.coverImage || null,
        status: validated.status,
        createdBy: user.id,
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "event",
      resourceId: event.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
