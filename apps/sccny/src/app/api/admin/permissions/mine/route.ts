import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse } from "@/lib/admin-auth";
import { getUserPermissions } from "@/lib/permissions";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    const permissions = await getUserPermissions(user.id);

    return NextResponse.json({ data: permissions });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
