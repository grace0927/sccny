import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import {
  copyTemplatePresentation,
  replacePlaceholders,
  replaceVerseContent,
  handleCommunionSlides,
  copyHymnSlides,
  buildPresentationUrl,
  fetchServiceRoles,
} from "@/lib/google-slides";
import { WorshipOrderData } from "@/lib/parse-worship-order";
import { prisma } from "@/lib/db";

const TEMPLATE_ID = process.env.GOOGLE_SLIDES_TEMPLATE_ID!;
const HYMN_BANK_ID = process.env.GOOGLE_HYMN_BANK_ID!;
const OUTPUT_FOLDER_ID = process.env.GOOGLE_SLIDES_OUTPUT_FOLDER_ID!;
const SCHEDULE_SHEET_ID = process.env.GOOGLE_SCHEDULE_SHEET_ID;
const BIBLE_SHEET_ID = process.env.GOOGLE_BIBLE_SHEET_ID;

/** Get the coming Sunday as a Date (today if already Sunday) */
function getComingSunday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);
  return sunday;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body: WorshipOrderData = await request.json();

    if (!TEMPLATE_ID || !OUTPUT_FOLDER_ID) {
      return NextResponse.json(
        { error: "Google Slides environment variables are not configured" },
        { status: 503 }
      );
    }

    const thisSunday = getComingSunday();
    const nextSunday = new Date(thisSunday);
    nextSunday.setDate(thisSunday.getDate() + 7);
    const sundayDate = formatDate(thisSunday);
    const title = sundayDate;

    // Fetch service roles from schedule sheet (non-fatal if not configured)
    const roles = SCHEDULE_SHEET_ID
      ? await fetchServiceRoles(SCHEDULE_SHEET_ID, thisSunday, nextSunday)
      : { thisWeek: {}, nextWeek: {} };

    // Look up English hymn titles from DB (for {C22}–{C25} placeholders)
    const hymnNumbers = body.hymns
      .map((h) => parseInt(h.number, 10))
      .filter((n) => !isNaN(n));
    const hymnRecords = hymnNumbers.length > 0
      ? await prisma.hymn.findMany({
          where: { number: { in: hymnNumbers } },
          select: { number: true, titleEn: true },
        })
      : [];
    const hymnEnMap = new Map(
      hymnRecords.map((h) => [String(h.number), h.titleEn ?? ""])
    );

    // 1. Copy template into output folder
    const presentationId = await copyTemplatePresentation(title, TEMPLATE_ID, OUTPUT_FOLDER_ID);

    // 2. Build placeholder map from form data + fetched schedule roles.
    // Keys are {XN} cell references from the Google Sheet "summary" tab,
    // matching what the original Apps Script (SheetData2Slides.gs) reads.
    const placeholderMap: Record<string, string> = {
      // Date (J1 = this Sunday's date)
      "{J1}": sundayDate,
      // Sermon title and preacher (multiple cell refs for template compatibility)
      "{B31}": body.sermonTitle || "",
      "{A32}": body.sermonTitle || "",
      "{B32}": body.sermonTitle || "",
      "{A33}": body.sermonSubtitle || "",
      "{B33}": roles.thisWeek["大堂信息"] || body.speaker || "",
      // Communion flag (H2) — Apps Script deletes communion slide when FALSE
      "{H2}": body.hasCommunion ? "TRUE" : "FALSE",
      // Hymns (rows 22–25): A = number, B = Chinese title, C = English title
      // Response hymn (回应诗歌) always goes into slot 25 (after the message);
      // remaining hymns fill slots 22–24 in order.
      ...((): Record<string, string> => {
        const regular = body.hymns.filter((h) => !h.isResponse);
        const response = body.hymns.find((h) => h.isResponse);
        const slots = [...regular, ...(response ? [] : []), undefined, undefined, undefined, undefined].slice(0, 3);
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
      "{B3}": roles.thisWeek["大堂信息"] || body.speaker || "", "{C3}": roles.nextWeek["大堂信息"] || "",
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
        { keyword: "宣召", vetitle: body.callToWorship, verse: body.callToWorship },
        { keyword: "读经", vetitle: body.scriptureReading, verse: body.scriptureReading },
        { keyword: "金句", vetitle: body.memoryVerse, verse: body.memoryVerse, noSplit: true },
        { keyword: "认罪", vetitle: body.confessionPrayer, verse: body.confessionPrayer },
        { keyword: "宣告赦免", vetitle: body.assuranceOfPardon, verse: body.assuranceOfPardon },
      ],
      BIBLE_SHEET_ID,
      isJoint
    );

    // 5. Handle communion slides
    await handleCommunionSlides(presentationId, body.hasCommunion);

    // 6. Copy hymn slides from hymn bank into the presentation (preserves editability).
    //    Hymns with a YouTube URL get a video slide instead of lyrics; those still
    //    need the bank for title-slide lookup, but we call even when HYMN_BANK_ID is
    //    absent so YouTube-only hymns are still processed.
    let missingHymns: string[] = [];
    if (body.hymns.length > 0 && (HYMN_BANK_ID || body.hymns.some((h) => h.youtubeUrl))) {
      missingHymns = await copyHymnSlides(presentationId, HYMN_BANK_ID || "", body.hymns);
    }

    const presentationUrl = buildPresentationUrl(presentationId);

    // 7. Audit log
    await logAction({
      userId: user.id,
      userName: user.displayName ?? user.primaryEmail ?? "Unknown",
      action: "CREATE",
      resourceType: "GoogleSlides",
      resourceId: presentationId,
      newValues: {
        title,
        sermonTitle: body.sermonTitle,
        speaker: body.speaker,
        hymns: body.hymns.map((h) => `${h.number} ${h.title}`).join(", "),
      },
    });

    return NextResponse.json({ presentationUrl, presentationId, missingHymns });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error generating slides:", error);
    return NextResponse.json(
      { error: "Failed to generate slides. Please try again." },
      { status: 500 }
    );
  }
}
