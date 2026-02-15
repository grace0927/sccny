import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { PrayerRequestCreateSchema } from "@/lib/admin-validations";

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { userId: user.id },
    });

    if (!member || member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Active membership required" }, { status: 403 });
    }

    const requests = await prisma.prayerRequest.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: requests });
  } catch (error) {
    console.error("Error fetching prayer requests:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { userId: user.id },
    });

    if (!member || member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Active membership required" }, { status: 403 });
    }

    const body = await request.json();
    const validated = PrayerRequestCreateSchema.parse(body);

    const prayerRequest = await prisma.prayerRequest.create({
      data: {
        memberId: member.id,
        content: validated.content,
        isAnonymous: validated.isAnonymous,
      },
    });

    return NextResponse.json(prayerRequest, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating prayer request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
