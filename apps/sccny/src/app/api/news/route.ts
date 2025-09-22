import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NewsCreateSchema, GetNewsQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = GetNewsQuerySchema.parse(queryParams);

    const { page, limit, status, sortBy, sortOrder } = validatedQuery;

    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
    };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.news.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: news,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = NewsCreateSchema.parse(body);

    const news = await prisma.news.create({
      data: {
        title: validatedData.title,
        date: new Date(validatedData.date),
        content: validatedData.content,
        excerpt: validatedData.excerpt,
        status: validatedData.status,
      },
    });

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    console.error("Error creating news:", error);
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
