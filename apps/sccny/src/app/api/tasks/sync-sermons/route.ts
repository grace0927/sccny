import { NextResponse } from "next/server";
import { sermonScraper } from "@/lib/sermon-scraper";

/**
 * GET /api/tasks/sync-sermons
 *
 * Manually trigger sermon synchronization from the church website
 * This endpoint is also called by Vercel cron jobs for automated daily sync
 */
export async function GET() {
  try {
    console.log("Starting manual sermon sync...");

    const result = await sermonScraper.syncSermons();

    console.log("Sermon sync completed successfully");

    return NextResponse.json({
      success: true,
      message:
        "Sermon synchronization API endpoint working (scraper disabled temporarily)",
      data: {
        newSermons: result.new,
        updatedSermons: result.updated,
        totalProcessed: result.new + result.updated,
        note: "Scraper functionality temporarily disabled for testing",
      },
    });
  } catch (error) {
    console.error("Error during sermon sync:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to synchronize sermons",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
