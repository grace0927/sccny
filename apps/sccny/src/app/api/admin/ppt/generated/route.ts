import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { listGeneratedPresentations } from "@/lib/google-drive";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const folderId = process.env.GOOGLE_SLIDES_OUTPUT_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json(
        { error: "Google Slides output folder is not configured" },
        { status: 503 }
      );
    }

    const data = await listGeneratedPresentations(folderId);

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error listing generated presentations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
