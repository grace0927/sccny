import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Verify a request came from the scheduler.
 *
 * Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron
 * invocations when `CRON_SECRET` is set in the project's environment.
 *
 * Fails closed: an unset `CRON_SECRET` rejects everything rather than leaving
 * the endpoint open. `CRON_SECRET` is already a documented, required env var
 * (see `turbo.json` and `README.md`).
 */
export function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured; rejecting task request");
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export function cronUnauthorizedResponse() {
  return NextResponse.json(
    { success: false, message: "Unauthorized" },
    { status: 401 }
  );
}
