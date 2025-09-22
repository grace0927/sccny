import { NextResponse } from "next/server";
import { newsScraper } from "@/lib/news-scraper";

/**
 * GET /api/tasks/sync-news
 *
 * Manually trigger news synchronization from the church website
 * Scrapes news from https://www.scc-ny.org/news/ and updates database
 */
export async function GET() {
  try {
    console.log("Starting manual news sync...");

    const result = await newsScraper.syncNews();

    console.log("News sync completed successfully");

    return NextResponse.json({
      success: true,
      message: "News synchronization completed successfully",
      data: {
        newNews: result.new,
        updatedNews: result.updated,
        totalProcessed: result.totalProcessed,
      },
    });
  } catch (error) {
    console.error("Error during news sync:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to synchronize news",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
