import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { stackServerApp } from "@/stack/server";
import { logAction } from "@/lib/audit";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "users.disable");

    const { id } = await params;
    const stackUser = await stackServerApp.getUser(id);
    if (!stackUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await stackUser.update({ restrictedByAdmin: false, restrictedByAdminReason: null });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "ENABLE",
      resourceType: "user",
      resourceId: id,
      newValues: { restrictedByAdmin: false },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error enabling user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
