import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const version = searchParams.get("version") || "unv";

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await axios.get(
      `https://bible.fhl.net/json/qsb.php?qstr=${encodeURIComponent(query)}${version !== "unv" ? `&version=${version}` : ""}`
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Bible API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Bible data" },
      { status: 500 }
    );
  }
}
