import "server-only";
import { google, type gmail_v1 } from "googleapis";
import { prisma } from "@/lib/db";
import { getGoogleAuth } from "@/lib/google-auth";
import { extractPlainTextBody, getHeader } from "@/lib/gmail-message";
import { parseWorshipOrderSmart } from "@/lib/parse-worship-order-llm";
import {
  generateWorshipSlides,
  InvalidScriptureRefsError,
} from "@/lib/generate-worship-slides";
import type { WorshipOrderData } from "@/lib/parse-worship-order";
import { getComingSunday, toDateInputValue } from "@/lib/service-date";
import { logAction } from "@/lib/audit";

/** `gmail.modify` covers both reading messages and relabeling them. */
const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

const IMPERSONATED_USER = process.env.GMAIL_IMPERSONATED_USER;
const WORSHIP_LABEL = process.env.GMAIL_WORSHIP_LABEL ?? "worship-order";
const PROCESSED_LABEL = process.env.GMAIL_PROCESSED_LABEL ?? "worship-order/processed";

/**
 * Cap per run so one backlog can't blow the serverless time budget.
 *
 * Generating a deck is minutes of Slides/Drive API calls, not milliseconds, and
 * the procedure arrives roughly once a week — an hourly poll has no reason to
 * batch. Anything beyond the cap is picked up by the next run, because
 * unprocessed messages keep their trigger label.
 */
const MAX_MESSAGES_PER_RUN = 3;

export interface IngestResult {
  scanned: number;
  generated: number;
  failed: number;
  skipped: number;
}

export class GmailNotConfiguredError extends Error {
  constructor() {
    super("GMAIL_IMPERSONATED_USER is not configured");
    this.name = "GmailNotConfiguredError";
  }
}

function getGmailClient(): gmail_v1.Gmail {
  if (!IMPERSONATED_USER) throw new GmailNotConfiguredError();
  // Domain-wide delegation: the service account acts as the Workspace mailbox.
  return google.gmail({
    version: "v1",
    auth: getGoogleAuth(GMAIL_SCOPES, IMPERSONATED_USER),
  });
}

/** Resolve a label name to its ID, creating the label if the mailbox lacks it. */
async function ensureLabel(gmail: gmail_v1.Gmail, name: string): Promise<string> {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = data.labels?.find((l) => l.name === name);
  if (existing?.id) return existing.id;

  const created = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  if (!created.data.id) throw new Error(`Failed to create Gmail label "${name}"`);
  return created.data.id;
}

/**
 * Poll the mailbox for labeled worship-procedure emails and turn each into a
 * Google Slides deck awaiting human review.
 *
 * Matching is controlled from Gmail itself: a filter applies `GMAIL_WORSHIP_LABEL`
 * to the weekly procedure email, so the church can change what counts as a
 * trigger without a deploy.
 *
 * Failure is per-message: a bad email marks its own job FAILED and the loop
 * continues, so one malformed procedure cannot block the rest of the batch.
 */
export async function ingestWorshipEmails(): Promise<IngestResult> {
  const gmail = getGmailClient();
  const result: IngestResult = { scanned: 0, generated: 0, failed: 0, skipped: 0 };

  const processedLabelId = await ensureLabel(gmail, PROCESSED_LABEL);

  const list = await gmail.users.messages.list({
    userId: "me",
    q: `label:"${WORSHIP_LABEL}" -label:"${PROCESSED_LABEL}"`,
    maxResults: MAX_MESSAGES_PER_RUN,
  });

  const messages = list.data.messages ?? [];
  result.scanned = messages.length;
  if (messages.length === 0) return result;

  const worshipLabelId = await ensureLabel(gmail, WORSHIP_LABEL);

  for (const { id: messageId } of messages) {
    if (!messageId) continue;

    // Dedup on the Gmail message ID rather than on labels alone: labels can be
    // re-applied by hand, and a crash between generating and relabeling would
    // otherwise produce a duplicate deck on the next run.
    const existing = await prisma.worshipSlideJob.findUnique({
      where: { gmailMessageId: messageId },
      select: { id: true },
    });
    if (existing) {
      result.skipped++;
      await relabel(gmail, messageId, processedLabelId, worshipLabelId);
      continue;
    }

    let jobId: string | null = null;
    try {
      const { data: message } = await gmail.users.messages.get({
        userId: "me",
        id: messageId,
        format: "full",
      });

      const payload = message.payload ?? undefined;
      const emailFrom = getHeader(payload, "From");
      const emailSubject = getHeader(payload, "Subject");
      const dateHeader = getHeader(payload, "Date");
      const emailReceivedAt = message.internalDate
        ? new Date(Number(message.internalDate))
        : dateHeader
          ? new Date(dateHeader)
          : new Date();

      const rawText = extractPlainTextBody(payload);

      // Create the row before any expensive work, so a crash mid-message still
      // leaves a dedup record and a visible trace of what was attempted.
      const job = await prisma.worshipSlideJob.create({
        data: {
          gmailMessageId: messageId,
          gmailThreadId: message.threadId ?? null,
          emailFrom,
          emailSubject,
          emailReceivedAt,
          rawText: rawText ?? "",
          status: "PENDING",
        },
      });
      jobId = job.id;

      if (!rawText || rawText.trim().length === 0) {
        throw new Error(
          "邮件没有纯文本正文（text/plain），无法解析崇拜程序。" +
            " (No plain-text body found in the email.)"
        );
      }

      await runJob(job.id, rawText, emailReceivedAt);
      result.generated++;
    } catch (error) {
      result.failed++;
      const errorMessage = describeError(error);
      console.error(`[worship-email-ingest] message ${messageId} failed:`, error);
      if (jobId) {
        await prisma.worshipSlideJob.update({
          where: { id: jobId },
          data: { status: "FAILED", errorMessage },
        });
      }
    }

    // Relabel whether the job succeeded or failed — the DB row is the retry
    // surface, not the inbox. Leaving a failed message labeled would make the
    // next run reprocess it forever.
    await relabel(gmail, messageId, processedLabelId, worshipLabelId);
  }

  return result;
}

/** Parse and generate for an existing job row, updating its status as it goes. */
export async function runJob(
  jobId: string,
  rawText: string,
  receivedAt: Date
): Promise<void> {
  const { data, source } = await parseWorshipOrderSmart(rawText);

  // The procedure is emailed during the week for the coming Sunday. A reviewer
  // can correct the date and regenerate from the wizard if this guess is wrong.
  const serviceDate = getComingSunday(receivedAt);

  await prisma.worshipSlideJob.update({
    where: { id: jobId },
    data: {
      parsedData: data as unknown as object,
      parseSource: source,
      serviceDate,
      status: "PARSED",
      errorMessage: null,
    },
  });

  const { presentationId, presentationUrl, missingHymns, title } =
    await generateWorshipSlides({ ...data, serviceDate: toDateInputValue(serviceDate) });

  await prisma.worshipSlideJob.update({
    where: { id: jobId },
    data: {
      status: "GENERATED",
      presentationId,
      presentationUrl,
      missingHymns,
    },
  });

  await logAction({
    // No system-actor convention existed before this job; "system" establishes one.
    userId: "system",
    userName: "Email Trigger",
    action: "CREATE",
    resourceType: "GoogleSlides",
    resourceId: presentationId,
    newValues: {
      title,
      jobId,
      source: "email",
      parseSource: source,
      sermonTitle: data.sermonTitle,
      speaker: data.speaker,
      hymns: data.hymns.map((h) => `${h.number} ${h.title}`).join(", "),
    },
  });
}

/** Re-run parse + generate for a job whose first attempt failed. */
export async function retryJob(jobId: string): Promise<void> {
  const job = await prisma.worshipSlideJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Job ${jobId} not found`);
  if (!job.rawText.trim()) {
    throw new Error("This job has no email text to re-parse.");
  }

  try {
    await runJob(job.id, job.rawText, job.emailReceivedAt);
  } catch (error) {
    await prisma.worshipSlideJob.update({
      where: { id: job.id },
      data: { status: "FAILED", errorMessage: describeError(error) },
    });
    throw error;
  }
}

/** Turn a thrown value into something a reviewer can act on. */
function describeError(error: unknown): string {
  if (error instanceof InvalidScriptureRefsError) {
    const detail = error.invalidRefs
      .map((r) => `${r.field}「${r.ref}」：${r.reason}`)
      .join("；");
    return `经文引用无效 — ${detail}`;
  }
  return error instanceof Error ? error.message : "Unknown error";
}

async function relabel(
  gmail: gmail_v1.Gmail,
  messageId: string,
  addLabelId: string,
  removeLabelId: string
): Promise<void> {
  try {
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: { addLabelIds: [addLabelId], removeLabelIds: [removeLabelId] },
    });
  } catch (error) {
    // Non-fatal: the unique gmailMessageId still prevents a duplicate deck.
    console.error(`[worship-email-ingest] failed to relabel ${messageId}:`, error);
  }
}

export type { WorshipOrderData };
