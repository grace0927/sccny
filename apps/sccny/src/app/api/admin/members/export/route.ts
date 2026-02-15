import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.export");

    const members = await prisma.member.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    });

    const headers = ["name", "nameZh", "email", "phone", "address", "birthday", "baptismDate", "fellowshipGroup", "ministryAssignments"];
    const rows = members.map((m) =>
      [
        m.name,
        m.nameZh || "",
        m.email || "",
        m.phone || "",
        m.address || "",
        m.birthday ? m.birthday.toISOString().split("T")[0] : "",
        m.baptismDate ? m.baptismDate.toISOString().split("T")[0] : "",
        m.fellowshipGroup || "",
        m.ministryAssignments.join(";"),
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "EXPORT",
      resourceType: "member",
      newValues: { count: members.length },
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="members-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error exporting members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
