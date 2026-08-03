import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { fetchSegments, loadBibleIndex, type VerseSegment } from "@/lib/bible-lookup";
import { BibleReferenceError, resolveRef } from "@/lib/bible-reference";

interface PreviewInput {
  /** Caller-chosen identifier echoed back, e.g. "memoryVerse". */
  field: string;
  ref: string;
}

export type VersePreviewResult =
  | { field: string; ref: string; ok: true; segments: VerseSegment[] }
  | { field: string; ref: string; ok: false; error: { code: string; message: string } };

/**
 * Resolve several worship-order scripture references in one round trip so the
 * PPT review step can show the operator exactly what will land on the slides.
 *
 * Results are per field: one bad reference must not blank the preview for the
 * others. Generation is blocked separately, in the generate-slides route.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body: { refs?: PreviewInput[] } = await request.json();
    const inputs = Array.isArray(body.refs) ? body.refs : [];

    const bibleSheetId = process.env.GOOGLE_BIBLE_SHEET_ID;
    if (!bibleSheetId) {
      return NextResponse.json(
        { error: "GOOGLE_BIBLE_SHEET_ID is not configured" },
        { status: 503 }
      );
    }

    // One index load for the whole batch (~31K verse keys).
    const index = await loadBibleIndex(bibleSheetId);

    const results: VersePreviewResult[] = await Promise.all(
      inputs.map(async ({ field, ref }): Promise<VersePreviewResult> => {
        const trimmed = (ref ?? "").trim();
        if (!trimmed) return { field, ref: trimmed, ok: true, segments: [] };
        try {
          const parsed = resolveRef(trimmed, index.books, index.bounds);
          return {
            field,
            ref: trimmed,
            ok: true,
            segments: await fetchSegments(bibleSheetId, index, parsed),
          };
        } catch (error) {
          if (error instanceof BibleReferenceError) {
            return {
              field,
              ref: trimmed,
              ok: false,
              error: { code: error.code, message: error.message },
            };
          }
          throw error;
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error previewing verses:", error);
    return NextResponse.json({ error: "Failed to look up verses" }, { status: 500 });
  }
}
