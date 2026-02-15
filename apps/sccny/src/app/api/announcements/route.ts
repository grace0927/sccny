import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        status: "PUBLISHED",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ isPinned: "desc" }, { priority: "desc" }, { startDate: "desc" }],
    });

    return NextResponse.json({ data: announcements });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
