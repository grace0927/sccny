import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "sermons.sync");

    // Trigger the existing sync endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/tasks/sync-sermons`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const result = await res.json();

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "SYNC",
      resourceType: "sermon",
      newValues: { result },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error syncing sermons:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
