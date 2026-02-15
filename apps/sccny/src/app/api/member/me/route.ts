import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { MemberProfileUpdateSchema } from "@/lib/admin-validations";

async function getAuthenticatedUser() {
  const user = await stackServerApp.getUser();
  if (!user) return null;
  return user;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lazy creation: auto-create Member record if it doesn't exist
    let member = await prisma.member.findUnique({
      where: { userId: user.id },
    });

    if (!member) {
      member = await prisma.member.create({
        data: {
          userId: user.id,
          name: user.displayName || user.primaryEmail || "Unknown",
          email: user.primaryEmail || undefined,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ data: member });
  } catch (error) {
    console.error("Error fetching member profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { userId: user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = MemberProfileUpdateSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.nameZh !== undefined) updateData.nameZh = validated.nameZh;
    if (validated.phone !== undefined) updateData.phone = validated.phone;
    if (validated.address !== undefined) updateData.address = validated.address;
    if (validated.birthday !== undefined) updateData.birthday = validated.birthday ? new Date(validated.birthday) : null;

    const updated = await prisma.member.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error updating member profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
