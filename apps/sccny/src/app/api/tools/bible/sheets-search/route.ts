import { NextRequest, NextResponse } from "next/server";
import { lookupBibleVerses } from "@/lib/bible-lookup";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const results = await lookupBibleVerses(q);
    return NextResponse.json({ status: results.length > 0 ? "success" : "not_found", results });
  } catch (error) {
    console.error("Bible Sheets lookup error:", error);
    return NextResponse.json({ error: "Failed to fetch Bible data" }, { status: 500 });
  }
}
