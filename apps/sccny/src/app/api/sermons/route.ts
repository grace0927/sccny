import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SermonCreateSchema, GetSermonsQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    console.log("DATABASE_URL in API:", process.env.DATABASE_URL);
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = GetSermonsQuerySchema.parse(queryParams);

    const { page, limit, search, speaker, series, type, sortBy, sortOrder } =
      validatedQuery;

    const skip = (page - 1) * limit;

    const where = {
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { speaker: { contains: search, mode: "insensitive" as const } },
          { scripture: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(speaker && {
        speaker: { contains: speaker, mode: "insensitive" as const },
      }),
      ...(series && {
        series: { contains: series, mode: "insensitive" as const },
      }),
      ...(type && { type }),
    };

    const [sermons, total] = await Promise.all([
      prisma.sermon.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.sermon.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: sermons,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching sermons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SermonCreateSchema.parse(body);

    const sermon = await prisma.sermon.create({
      data: {
        title: validatedData.title,
        speaker: validatedData.speaker,
        date: new Date(validatedData.date),
        series: validatedData.series,
        scripture: validatedData.scripture,
        videoUrl: validatedData.videoUrl || null,
        audioUrl: validatedData.audioUrl || null,
        description: validatedData.description,
      },
    });

    return NextResponse.json(sermon, { status: 201 });
  } catch (error) {
    console.error("Error creating sermon:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: (error as unknown as { errors: unknown }).errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
