import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { EventRegistrationCreateSchema } from "@/lib/admin-validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id, status: "PUBLISHED" },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = EventRegistrationCreateSchema.parse(body);

    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        memberId: validated.memberId || null,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error registering for event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
