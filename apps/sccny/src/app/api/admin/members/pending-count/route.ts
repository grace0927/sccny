import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.view");

    const count = await prisma.member.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({ data: { count } });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching pending count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
