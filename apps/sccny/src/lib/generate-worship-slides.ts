import "server-only";
import {
  copyTemplatePresentation,
  replacePlaceholders,
  replaceVerseContent,
  handleCommunionSlides,
  copyHymnSlides,
  buildPresentationUrl,
  fetchServiceRoles,
} from "@/lib/google-slides";
import { WorshipOrderData, collectScriptureRefs } from "@/lib/parse-worship-order";
import { resolveReference } from "@/lib/bible-lookup";
import { BibleReferenceError } from "@/lib/bible-reference";
import { getComingSunday, parseServiceDate, formatCompact } from "@/lib/service-date";
import { prisma } from "@/lib/db";

const TEMPLATE_ID = process.env.GOOGLE_SLIDES_TEMPLATE_ID!;
const HYMN_BANK_ID = process.env.GOOGLE_HYMN_BANK_ID!;
const OUTPUT_FOLDER_ID = process.env.GOOGLE_SLIDES_OUTPUT_FOLDER_ID!;
const SCHEDULE_SHEET_ID = process.env.GOOGLE_SCHEDULE_SHEET_ID;
const BIBLE_SHEET_ID = process.env.GOOGLE_BIBLE_SHEET_ID;

export interface InvalidScriptureRef {
  field: string;
  ref: string;
  reason: string;
}

/** At least one scripture reference could not be resolved; nothing was written to Drive. */
export class InvalidScriptureRefsError extends Error {
  readonly invalidRefs: InvalidScriptureRef[];
  constructor(invalidRefs: InvalidScriptureRef[]) {
    super(`Invalid scripture references: ${invalidRefs.map((r) => r.ref).join(", ")}`);
    this.name = "InvalidScriptureRefsError";
    this.invalidRefs = invalidRefs;
  }
}

/** The Google Slides template / output folder env vars are missing. */
export class SlidesNotConfiguredError extends Error {
  constructor() {
    super("Google Slides environment variables are not configured");
    this.name = "SlidesNotConfiguredError";
  }
}

export interface GenerateWorshipSlidesResult {
  presentationId: string;
  presentationUrl: string;
  missingHymns: string[];
  /** Deck title (compact service date, e.g. "20260830"). */
  title: string;
}

/**
 * Build a worship-service Google Slides deck from parsed worship-order data.
 *
 * Extracted from the `generate-slides` route so both the operator-driven wizard
 * and the email-triggered cron job run the exact same pipeline. Callers supply
 * their own authorization and audit logging.
 *
 * @throws {InvalidScriptureRefsError} before any Drive call, so a bad reference
 *   can never leave an orphaned deck in the output folder.
 * @throws {SlidesNotConfiguredError} when the template/output-folder env vars are unset.
 */
export async function generateWorshipSlides(
  input: WorshipOrderData & { serviceDate?: string }
): Promise<GenerateWorshipSlidesResult> {
  if (!TEMPLATE_ID || !OUTPUT_FOLDER_ID) {
    throw new SlidesNotConfiguredError();
  }

  // Validate every scripture reference BEFORE touching Drive, so an invalid
  // reference can never leave an orphaned deck in the output folder — and so
  // the operator is told which field is wrong instead of finding the raw
  // reference text printed where scripture should be.
  if (BIBLE_SHEET_ID) {
    const invalidRefs: Array<{ field: string; ref: string; reason: string }> = [];
    for (const { label, ref } of collectScriptureRefs(input)) {
      try {
        await resolveReference(ref);
      } catch (error) {
        if (!(error instanceof BibleReferenceError)) throw error;
        invalidRefs.push({ field: label, ref, reason: error.message });
      }
    }
    if (invalidRefs.length > 0) {
      throw new InvalidScriptureRefsError(invalidRefs);
    }
  }

  // Use the client-selected Sunday; fall back to the coming Sunday for
  // older clients or an invalid value.
  const thisSunday = parseServiceDate(input.serviceDate) ?? getComingSunday();
  const nextSunday = new Date(thisSunday);
  nextSunday.setDate(thisSunday.getDate() + 7);
  const sundayDate = formatCompact(thisSunday);
  const title = sundayDate;

  // Fetch service roles from schedule sheet (non-fatal if not configured)
  const roles = SCHEDULE_SHEET_ID
    ? await fetchServiceRoles(SCHEDULE_SHEET_ID, thisSunday, nextSunday)
    : { thisWeek: {}, nextWeek: {} };

  // Look up hymn records from DB: English titles (for {C22}–{C25} placeholders),
  // indexed bank-slide ranges, and stored lyrics (slide-copy fallbacks)
  const hymnNumbers = input.hymns
    .map((h) => parseInt(h.number, 10))
    .filter((n) => !isNaN(n));
  const hymnRecords = hymnNumbers.length > 0
    ? await prisma.hymn.findMany({
        where: { number: { in: hymnNumbers } },
        select: {
          number: true,
          titleEn: true,
          lyricsZh: true,
          lyricsEn: true,
          slidesUrl: true,
          slideStartIndex: true,
          slideEndIndex: true,
        },
      })
    : [];
  const hymnEnMap = new Map(
    hymnRecords.map((h) => [String(h.number), h.titleEn ?? ""])
  );
  const hymnRecordMap = new Map(hymnRecords.map((h) => [String(h.number), h]));

  // 1. Copy template into output folder
  const presentationId = await copyTemplatePresentation(title, TEMPLATE_ID, OUTPUT_FOLDER_ID);

  // 2. Build placeholder map from form data + fetched schedule roles.
  // Keys are {XN} cell references from the Google Sheet "summary" tab,
  // matching what the original Apps Script (SheetData2Slides.gs) reads.
  const placeholderMap: Record<string, string> = {
    // Date (J1 = this Sunday's date)
    "{J1}": sundayDate,
    // Sermon title and preacher (multiple cell refs for template compatibility)
    "{B31}": input.sermonTitle || "",
    "{A32}": input.sermonTitle || "",
    "{B32}": input.sermonTitle || "",
    "{A33}": input.sermonSubtitle || "",
    "{B33}": roles.thisWeek["大堂信息"] || input.speaker || "",
    // Communion flag (H2) — Apps Script deletes communion slide when FALSE
    "{H2}": input.hasCommunion ? "TRUE" : "FALSE",
    // Hymns (rows 22–25): A = number, B = Chinese title, C = English title
    // Response hymn (回应诗歌) always goes into slot 25 (after the message);
    // remaining hymns fill slots 22–24 in order.
    ...((): Record<string, string> => {
      const regular = input.hymns.filter((h) => !h.isResponse);
      const response = input.hymns.find((h) => h.isResponse);
      const slots = [...regular, undefined, undefined, undefined].slice(0, 3);
      const h = (i: number) => slots[i];
      const en = (i: number) => hymnEnMap.get(slots[i]?.number ?? "") ?? "";
      return {
        "{A22}": h(0)?.number ?? "", "{B22}": h(0)?.title ?? "", "{C22}": en(0),
        "{A23}": h(1)?.number ?? "", "{B23}": h(1)?.title ?? "", "{C23}": en(1),
        "{A24}": h(2)?.number ?? "", "{B24}": h(2)?.title ?? "", "{C24}": en(2),
        "{A25}": response?.number ?? "", "{B25}": response?.title ?? "",
        "{C25}": hymnEnMap.get(response?.number ?? "") ?? "",
      };
    })(),
    // Static label columns (A) and header row
    "{A1}": "",
    "{B1}": "本主日",
    "{C1}": "下主日",
    "{A2}": "领会",  "{A3}": "信息",  "{A4}": "司琴",
    "{A5}": "招待",  "{A6}": "音影",  "{A7}": "爱筵",
    "{A8}": "清洁",  "{A9}": "大班",  "{A10}": "中班",
    "{A11}": "小班", "{A12}": "English Sermon",
    "{A13}": "值日", "{A14}": "报告", "{A15}": "翻译",
    // Dynamic roles from schedule sheet.
    // Keys use normalized header names (first line before \n, spaces stripped).
    // Schedule col C="司会" (worship leader), D="大堂信息" (speaker),
    // E="司琴", F="招待", G="音影", H="报告", I="翻译", J="英文堂信息",
    // M="儿童主日学小班", N="儿童主日学中班", P="愛筵" (traditional 愛).
    "{B2}": roles.thisWeek["司会"] || "",   "{C2}": roles.nextWeek["司会"] || "",
    // B3 = speaker: prefer schedule col D "大堂信息", fall back to form value
    "{B3}": roles.thisWeek["大堂信息"] || input.speaker || "", "{C3}": roles.nextWeek["大堂信息"] || "",
    "{B4}": roles.thisWeek["司琴"] || "",   "{C4}": roles.nextWeek["司琴"] || "",
    "{B5}": roles.thisWeek["招待"] || "",   "{C5}": roles.nextWeek["招待"] || "",
    "{B6}": roles.thisWeek["音影"] || "",   "{C6}": roles.nextWeek["音影"] || "",
    "{B7}": roles.thisWeek["愛筵"] || "",   "{C7}": roles.nextWeek["愛筵"] || "",
    "{B8}": roles.thisWeek["清潔"] || "",   "{C8}": roles.nextWeek["清潔"] || "",
    "{B9}": roles.thisWeek["大班"] || "",   "{C9}": roles.nextWeek["大班"] || "",
    "{B10}": roles.thisWeek["儿童主日学中班"] || "",  "{C10}": roles.nextWeek["儿童主日学中班"] || "",
    "{B11}": roles.thisWeek["儿童主日学小班"] || "",  "{C11}": roles.nextWeek["儿童主日学小班"] || "",
    "{B12}": roles.thisWeek["英文堂信息"] || "", "{C12}": roles.nextWeek["英文堂信息"] || "",
    "{B13}": roles.thisWeek["值日同工"] || "",  "{C13}": roles.nextWeek["值日同工"] || "",
    "{B14}": roles.thisWeek["报告"] || "",  "{C14}": roles.nextWeek["报告"] || "",
    "{B15}": roles.thisWeek["翻译"] || "",  "{C15}": roles.nextWeek["翻译"] || "",
  };

  // 3. Replace placeholders
  await replacePlaceholders(presentationId, placeholderMap);

  // 4. Replace [verse] / [vetitle] in per-slide scripture sections.
  //    Each entry's keyword identifies the slide; replacements are targeted to that page only.
  //    [vetitle] = scripture reference; [verse] = Bible text (reference used as fallback).
  // Joint service: English verses inserted after Chinese when schedule marks "joint"
  const isJoint = (roles.thisWeek["英文堂信息"] || "").toLowerCase().trim() === "joint";

  await replaceVerseContent(
    presentationId,
    [
      input.callToWorshipCustomText
        // Custom text is printed verbatim — never parsed as a reference.
        ? { keyword: "宣召", vetitle: "", verse: input.callToWorshipCustomText, literal: true }
        : { keyword: "宣召", vetitle: input.callToWorship, verse: input.callToWorship },
      { keyword: "读经", vetitle: input.scriptureReading, verse: input.scriptureReading },
      { keyword: "金句", vetitle: input.memoryVerse, verse: input.memoryVerse, noSplit: true },
      { keyword: "认罪", vetitle: input.confessionPrayer, verse: input.confessionPrayer },
      { keyword: "宣告赦免", vetitle: input.assuranceOfPardon, verse: input.assuranceOfPardon },
    ],
    BIBLE_SHEET_ID,
    isJoint
  );

  // 5. Handle communion slides
  await handleCommunionSlides(presentationId, input.hasCommunion);

  // 6. Copy hymn slides from hymn bank into the presentation (preserves editability).
  //    Hymns with a YouTube URL get a video slide instead of lyrics; those still
  //    need the bank for title-slide lookup, but we call even when HYMN_BANK_ID is
  //    absent so YouTube-only hymns are still processed.
  let missingHymns: string[] = [];
  if (input.hymns.length > 0) {
    const hymnSources = input.hymns.map((h) => {
      const record = hymnRecordMap.get(String(parseInt(h.number, 10)));
      return {
        title: h.title,
        youtubeUrl: h.youtubeUrl,
        slidesUrl: record?.slidesUrl,
        slideStartIndex: record?.slideStartIndex,
        slideEndIndex: record?.slideEndIndex,
        lyricsZh: record?.lyricsZh,
        lyricsEn: record?.lyricsEn,
      };
    });
    missingHymns = await copyHymnSlides(presentationId, HYMN_BANK_ID || "", hymnSources);
  }

  const presentationUrl = buildPresentationUrl(presentationId);
  return { presentationId, presentationUrl, missingHymns, title };
}
