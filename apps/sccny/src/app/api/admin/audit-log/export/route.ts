import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetAuditLogQuerySchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "audit.export");

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validated = GetAuditLogQuerySchema.parse(queryParams);

    const { userId, action, resourceType, dateFrom, dateTo, sortOrder } = validated;

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(resourceType && { resourceType }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: sortOrder },
      take: 10000,
    });

    // Build CSV
    const headers = ["ID", "User", "Action", "Resource Type", "Resource ID", "Created At"];
    const rows = logs.map((log) =>
      [
        log.id,
        log.userName,
        log.action,
        log.resourceType,
        log.resourceId || "",
        log.createdAt.toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "EXPORT",
      resourceType: "audit_log",
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error exporting audit logs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
