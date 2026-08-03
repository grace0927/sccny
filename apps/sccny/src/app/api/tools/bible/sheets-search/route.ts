import { NextRequest, NextResponse } from "next/server";
import { lookupBibleVerses } from "@/lib/bible-lookup";
import { BibleReferenceError } from "@/lib/bible-reference";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const results = await lookupBibleVerses(q);
    return NextResponse.json({ status: results.length > 0 ? "success" : "not_found", results });
  } catch (error) {
    // A reference naming a book, chapter or verse that doesn't exist is the
    // caller's mistake, not a server fault. It gets its own status so the client
    // reports it instead of falling back to a source that would answer with
    // different — and equally wrong — verses.
    if (error instanceof BibleReferenceError) {
      return NextResponse.json(
        {
          status: "invalid_reference",
          ref: error.ref,
          error: { code: error.code, message: error.message, params: error.params },
        },
        { status: 400 }
      );
    }
    console.error("Bible Sheets lookup error:", error);
    return NextResponse.json({ error: "Failed to fetch Bible data" }, { status: 500 });
  }
}
