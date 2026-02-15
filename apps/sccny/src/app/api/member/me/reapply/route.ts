import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";

export async function POST() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const member = await prisma.member.findUnique({
      where: { userId: user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    if (member.status !== "REJECTED") {
      return NextResponse.json({ error: "Can only re-apply from REJECTED status" }, { status: 400 });
    }

    const updated = await prisma.member.update({
      where: { userId: user.id },
      data: {
        status: "PENDING",
        rejectionReason: null,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error re-applying for membership:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
