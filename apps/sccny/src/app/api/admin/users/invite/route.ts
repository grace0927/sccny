import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { stackServerApp } from "@/stack/server";
import { UserInviteSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "users.invite");

    const body = await request.json();
    const { email } = UserInviteSchema.parse(body);

    // Create user in Stack Auth with a temporary password (they'll reset it)
    const newUser = await stackServerApp.createUser({
      primaryEmail: email,
      primaryEmailAuthEnabled: true,
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "INVITE",
      resourceType: "user",
      resourceId: newUser.id,
      newValues: { email },
    });

    return NextResponse.json({ data: { id: newUser.id, email } }, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error inviting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
