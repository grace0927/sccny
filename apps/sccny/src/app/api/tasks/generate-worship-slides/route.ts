import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron, cronUnauthorizedResponse } from "@/lib/cron-auth";
import {
  ingestWorshipEmails,
  GmailNotConfiguredError,
} from "@/lib/worship-email-ingest";

/**
 * GET /api/tasks/generate-worship-slides
 *
 * Poll the Gmail mailbox for labeled worship-procedure emails and generate a
 * Google Slides deck for each. Generated decks land in `/admin/ppt/pending`
 * for an operator to review before Sunday.
 *
 * Scheduled daily (10:00 UTC) via `vercel.json`; guarded by `CRON_SECRET`.
 * Daily rather than hourly because the Vercel Hobby plan permits only daily
 * crons — and the procedure arrives about once a week, so a day of latency
 * still leaves ample time before Sunday.
 */
// Building a deck is many sequential Slides/Drive calls; the default 60s budget
// is not enough for even one. 300s is the Vercel ceiling for Node functions.
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) return cronUnauthorizedResponse();

  try {
    console.log("Starting worship email ingest...");
    const result = await ingestWorshipEmails();
    console.log(
      `Worship email ingest completed: ${JSON.stringify(result)}`
    );
    return NextResponse.json({
      success: true,
      message: "Worship email ingest completed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof GmailNotConfiguredError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 503 }
      );
    }
    console.error("Error during worship email ingest:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to ingest worship emails",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
