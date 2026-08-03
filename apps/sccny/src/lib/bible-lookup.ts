import "server-only";
import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";
import fs from "fs";
import {
  BibleReferenceError,
  type BibleBounds,
  type BookName,
  type ParsedRef,
  type VerseSegment,
  buildBounds,
  formatRefTitle,
  indexOfKey,
  resolveRef,
  verseKey,
} from "./bible-reference";

export { BibleReferenceError } from "./bible-reference";
export type { ParsedRef, VerseSegment } from "./bible-reference";

// ── Sheets client ────────────────────────────────────────────────────────────

let sheetsClient: sheets_v4.Sheets | null = null;

function getSheetsClient(): sheets_v4.Sheets {
  if (sheetsClient) return sheetsClient;

  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsJson && !credentialsPath) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not configured");
  }

  const credentials = credentialsJson
    ? JSON.parse(credentialsJson)
    : JSON.parse(fs.readFileSync(credentialsPath!, "utf-8"));

  sheetsClient = google.sheets({
    version: "v4",
    auth: new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    }),
  });
  return sheetsClient;
}

// ── Index (book names + verse key column) ────────────────────────────────────

export interface BibleIndex {
  books: BookName[];
  /** bibleData column A, sorted. Row number in the sheet is index + 1. */
  keys: number[];
  bounds: BibleBounds;
}

const indexCache = new Map<string, Promise<BibleIndex>>();

async function fetchBibleIndex(bibleSheetId: string): Promise<BibleIndex> {
  const sheets = getSheetsClient();
  const [bnRes, bdRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: bibleSheetId,
      range: "bookNames!A:C",
      valueRenderOption: "FORMATTED_VALUE",
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: bibleSheetId,
      range: "bibleData!A:A",
      valueRenderOption: "FORMATTED_VALUE",
    }),
  ]);

  const books: BookName[] = ((bnRes.data.values || []) as string[][])
    .filter((r) => r[0] && r[2] && r[0] !== "----" && !isNaN(parseInt(r[2], 10)))
    .map((r) => ({ zhName: r[0], enName: r[1] ?? "", bookNum: parseInt(r[2], 10) }));

  const keys = ((bdRes.data.values || []) as string[][])
    .map((r) => parseInt(r[0] || "0", 10))
    .filter((n) => n > 0);

  return { books, keys, bounds: buildBounds(keys) };
}

/**
 * Load (and cache per sheet id) the book list and verse key column.
 *
 * The key column is ~31K static rows; re-fetching it per lookup was the single
 * biggest cost of this module. The cache stores the in-flight promise so
 * concurrent callers share one round trip; a failed load is evicted so the next
 * caller retries.
 */
export async function loadBibleIndex(bibleSheetId: string): Promise<BibleIndex> {
  const cached = indexCache.get(bibleSheetId);
  if (cached) return cached;

  const pending = fetchBibleIndex(bibleSheetId).catch((err) => {
    indexCache.delete(bibleSheetId);
    throw err;
  });
  indexCache.set(bibleSheetId, pending);
  return pending;
}

function requireSheetId(): string {
  const bibleSheetId = process.env.GOOGLE_BIBLE_SHEET_ID;
  if (!bibleSheetId) throw new Error("GOOGLE_BIBLE_SHEET_ID is not configured");
  return bibleSheetId;
}

// ── Verse text ───────────────────────────────────────────────────────────────

/**
 * Label a verse within a segment: bare "16" normally, but "2:1" at (and after) a
 * chapter boundary so cross-chapter passages stay readable on a slide.
 */
function verseLabel(chapter: number, verse: number, startChapter: number): string {
  return chapter === startChapter ? `${verse}` : `${chapter}:${verse}`;
}

/** Fetch the verse text for one already-validated range. */
async function fetchSegment(
  bibleSheetId: string,
  index: BibleIndex,
  ref: ParsedRef
): Promise<VerseSegment> {
  const startIdx = indexOfKey(index.keys, verseKey(ref.bookNum, ref.startChapter, ref.startVerse));
  const endIdx = indexOfKey(index.keys, verseKey(ref.bookNum, ref.endChapter, ref.endVerse));

  // resolveRef() has already bounds-checked both ends against the same key
  // column, so a miss here means the sheet changed underneath us.
  if (startIdx < 0 || endIdx < 0) {
    throw new BibleReferenceError(
      "UNPARSEABLE",
      formatRefTitle(ref, "zh"),
      `经文数据中找不到：${formatRefTitle(ref, "zh")}`
    );
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: bibleSheetId,
    range: `bibleData!B${startIdx + 1}:C${endIdx + 1}`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  const verseRows = (res.data.values || []) as string[][];

  const zhVerses: string[] = [];
  const enVerses: string[] = [];
  // Verse numbers come from the key column, never from a running counter —
  // a counter is wrong the moment the range crosses a chapter boundary.
  for (let i = 0; i <= endIdx - startIdx; i++) {
    const key = index.keys[startIdx + i];
    const chapter = Math.floor((key % 1_000_000) / 1_000);
    const label = verseLabel(chapter, key % 1_000, ref.startChapter);
    const row = verseRows[i] || [];
    zhVerses.push(`${label} ${(row[0] || "").trim()}`.trimEnd());
    enVerses.push(`${label} ${(row[1] || "").trim()}`.trimEnd());
  }

  return {
    zhTitle: formatRefTitle(ref, "zh"),
    enTitle: formatRefTitle(ref, "en"),
    zhVerses,
    enVerses,
  };
}

/** Fetch verse text for a list of already-resolved ranges, in parallel. */
export async function fetchSegments(
  bibleSheetId: string,
  index: BibleIndex,
  refs: ParsedRef[]
): Promise<VerseSegment[]> {
  return Promise.all(refs.map((ref) => fetchSegment(bibleSheetId, index, ref)));
}

/**
 * Resolve a reference string against the shared index without fetching text.
 * Used to validate before doing expensive work (e.g. copying a Slides deck).
 *
 * @throws BibleReferenceError
 */
export async function resolveReference(ref: string): Promise<ParsedRef[]> {
  const bibleSheetId = requireSheetId();
  const index = await loadBibleIndex(bibleSheetId);
  return resolveRef(ref, index.books, index.bounds);
}

/**
 * Look up Bible verses from the Google Sheets Bible data source.
 *
 * Accepts single, cross-chapter and multi-range refs — "约 3:16",
 * "约翰福音1:1-2:2", "John 1:1-2:2", "林前1:18-25, 2:1-8".
 * Returns one VerseSegment per comma-separated range.
 *
 * @throws BibleReferenceError when the reference names a book, chapter or verse
 *         that does not exist — never a partial or clamped result.
 * @throws Error when GOOGLE_BIBLE_SHEET_ID or credentials are not configured.
 */
export async function lookupBibleVerses(ref: string): Promise<VerseSegment[]> {
  const bibleSheetId = requireSheetId();
  const index = await loadBibleIndex(bibleSheetId);
  const refs = resolveRef(ref, index.books, index.bounds);
  return fetchSegments(bibleSheetId, index, refs);
}
