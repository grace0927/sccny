import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SermonCreateSchema } from "@/lib/validations";
import { ZodError } from "zod";

// GET /api/sermons/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sermon = await prisma.sermon.findUnique({
      where: { id },
    });

    if (!sermon) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    return NextResponse.json(sermon);
  } catch (error) {
    console.error("Error fetching sermon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/sermons/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if sermon exists
    const existingSermon = await prisma.sermon.findUnique({
      where: { id },
    });

    if (!existingSermon) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    const validatedData = SermonCreateSchema.partial().parse(body);

    const updatedSermon = await prisma.sermon.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.speaker && { speaker: validatedData.speaker }),
        ...(validatedData.date && { date: new Date(validatedData.date) }),
        ...(validatedData.series !== undefined && {
          series: validatedData.series,
        }),
        ...(validatedData.scripture !== undefined && {
          scripture: validatedData.scripture,
        }),
        ...(validatedData.videoUrl !== undefined && {
          videoUrl: validatedData.videoUrl,
        }),
        ...(validatedData.audioUrl !== undefined && {
          audioUrl: validatedData.audioUrl,
        }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
      },
    });

    return NextResponse.json(updatedSermon);
  } catch (error) {
    console.error("Error updating sermon:", error);
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sermons/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if sermon exists
    const existingSermon = await prisma.sermon.findUnique({
      where: { id },
    });

    if (!existingSermon) {
      return NextResponse.json({ error: "Sermon not found" }, { status: 404 });
    }

    await prisma.sermon.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting sermon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
