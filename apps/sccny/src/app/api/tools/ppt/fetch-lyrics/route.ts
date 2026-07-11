import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { fetchChineseLyrics, fetchEnglishLyrics } from "@/lib/hymn-lyrics";

/**
 * Fetch hymn lyrics from public web sources for operator review.
 * Nothing is persisted — the client shows an editable preview and saves
 * via /api/tools/ppt/save-hymn-lyrics.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body: { number?: number; titleEn?: string } = await request.json();
    const number = typeof body.number === "number" ? body.number : parseInt(String(body.number), 10);
    if (isNaN(number) || number <= 0) {
      return NextResponse.json({ error: "A valid hymn number is required" }, { status: 400 });
    }

    const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
    const [zh, en] = await Promise.all([
      fetchChineseLyrics(number),
      titleEn ? fetchEnglishLyrics(titleEn) : Promise.resolve(null),
    ]);

    return NextResponse.json({ zh, en });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching lyrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
