import "server-only";
import { google } from "googleapis";
import fs from "fs";

function getSheetsClient() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsJson && !credentialsPath) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not configured");
  }

  const credentials = credentialsJson
    ? JSON.parse(credentialsJson)
    : JSON.parse(fs.readFileSync(credentialsPath!, "utf-8"));

  return google.sheets({
    version: "v4",
    auth: new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    }),
  });
}

// ── Book abbreviation map ────────────────────────────────────────────────────

const BOOK_ABBREV_MAP: Record<string, string> = {
  "林前": "哥林多前书", "林后": "哥林多后书", "林後": "哥林多后书",
  "帖前": "帖撒罗尼迦前书", "帖后": "帖撒罗尼迦后书", "帖後": "帖撒罗尼迦后书",
  "提前": "提摩太前书",    "提后": "提摩太后书",    "提後": "提摩太后书",
  "彼前": "彼得前书",      "彼后": "彼得后书",      "彼後": "彼得后书",
  "撒上": "撒母耳记上",    "撒下": "撒母耳记下",
  "王上": "列王纪上",      "王下": "列王纪下",
  "代上": "历代志上",      "代下": "历代志下",
  "约一": "约翰一书",      "约二": "约翰二书",   "约三": "约翰三书",
  "弗":   "以弗所书",      "腓": "腓立比书",     "西": "歌罗西书",
  "多":   "提多书",        "门": "腓利门书",     "来": "希伯来书",
  "雅":   "雅各书",        "犹": "犹大书",       "启": "启示录",   "啟": "启示录",
  "罗":   "罗马书",        "加": "加拉太书",
  "太":   "马太福音",      "可": "马可福音",     "路": "路加福音",
  "约":   "约翰福音",      "徒": "使徒行传",
  "创":   "创世记",        "出": "出埃及记",     "利": "利未记",
  "民":   "民数记",        "申": "申命记",       "书": "约书亚记",
  "士":   "士师记",        "得": "路得记",       "拉": "以斯拉记",
  "尼":   "尼希米记",      "斯": "以斯帖记",     "伯": "约伯记",
  "诗":   "诗篇",          "詩": "诗篇",         "传": "传道书",   "傳": "传道书",   "歌": "雅歌",
  "赛":   "以赛亚书",      "耶": "耶利米书",     "哀": "耶利米哀歌",
  "结":   "以西结书",      "但": "但以理书",     "何": "何西阿书",
  "珥":   "约珥书",        "摩": "阿摩司书",     "俄": "俄巴底亚书",
  "拿":   "约拿书",        "弥": "弥迦书",       "鸿": "那鸿书",   "鴻": "那鸿书",
  "哈":   "哈巴谷书",      "番": "西番雅书",     "该": "哈该书",
  "亚":   "撒迦利亚书",    "玛": "玛拉基书",
};

// Pre-sort longest-first so short prefixes don't shadow longer ones.
const ABBREV_ENTRIES = Object.entries(BOOK_ABBREV_MAP).sort((a, b) => b[0].length - a[0].length);

// ── Pure helpers ─────────────────────────────────────────────────────────────

function expandBookAbbreviation(ref: string): string {
  for (const [abbrev, full] of ABBREV_ENTRIES) {
    if (!ref.startsWith(abbrev)) continue;
    const after = ref.slice(abbrev.length);
    if (after === "" || /^[\d第\s：:]/.test(after)) return full + after;
  }
  return ref;
}

function normalizeChapterRef(ref: string): string {
  const cn: Record<string, number> = {
    "一": 1, "二": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9,
    "十": 10, "十一": 11, "十二": 12, "十三": 13, "十四": 14, "十五": 15,
    "十六": 16, "十七": 17, "十八": 18, "十九": 19, "二十": 20,
    "二十一": 21, "二十二": 22, "二十三": 23, "二十四": 24, "二十五": 25,
    "二十六": 26, "二十七": 27, "二十八": 28, "二十九": 29, "三十": 30,
  };
  return ref.replace(/第([二三四五六七八九十一]+)章/, (_, ch: string) =>
    cn[ch] !== undefined ? String(cn[ch]) : ch
  );
}

function binarySearchLE(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1, result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= target) { result = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return result;
}

function parseVerseRef(
  ref: string,
  bookNamesList: Array<{ zhName: string; enName: string; bookNum: number }>
): { bookNum: number; bookZh: string; bookEn: string; chapter: number; startVerse: number; endVerse: number; verseSpecified: boolean } | null {
  const normalized = normalizeChapterRef(expandBookAbbreviation(ref.trim()));
  for (const { zhName, enName, bookNum } of bookNamesList) {
    if (!normalized.startsWith(zhName)) continue;
    const rest = normalized.slice(zhName.length).trimStart();
    const m = rest.match(/^(\d+)章?(?:[：:](\d+)(?:[-~](\d+))?)?/);
    if (!m) continue;
    const chapter    = parseInt(m[1], 10);
    const startVerse = m[2] ? parseInt(m[2], 10) : 1;
    const endVerse   = m[3] ? parseInt(m[3], 10) : startVerse;
    return { bookNum, bookZh: zhName, bookEn: enName, chapter, startVerse, endVerse, verseSpecified: !!m[2] };
  }
  return null;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface VerseSegment {
  zhTitle: string;
  enTitle: string;
  zhVerses: string[];
  enVerses: string[];
}

// ── Fetch ────────────────────────────────────────────────────────────────────

async function fetchSingleRef(
  bibleSheetId: string,
  ref: string,
  bookNamesList: Array<{ zhName: string; enName: string; bookNum: number }>,
  bibleDataKeys: number[]
): Promise<VerseSegment | null> {
  const parsed = parseVerseRef(ref, bookNamesList);
  if (!parsed) return null;

  const { bookNum, bookZh, bookEn, chapter, startVerse, endVerse, verseSpecified } = parsed;
  const startKey = bookNum * 1000000 + chapter * 1000 + startVerse;
  const startIdx = binarySearchLE(bibleDataKeys, startKey);

  if (startIdx < 0 || bibleDataKeys[startIdx] !== startKey) return null;

  const endKey = verseSpecified
    ? bookNum * 1000000 + chapter * 1000 + endVerse
    : bookNum * 1000000 + chapter * 1000 + 999;
  const endIdx = Math.min(binarySearchLE(bibleDataKeys, endKey), bibleDataKeys.length - 1);

  const actualEndVerse = bibleDataKeys[endIdx] % 1000;
  const verseRange = actualEndVerse === startVerse ? `${startVerse}` : `${startVerse}-${actualEndVerse}`;

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: bibleSheetId,
    range: `bibleData!B${startIdx + 1}:C${endIdx + 1}`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  const verseRows = (res.data.values || []) as string[][];

  return {
    zhTitle: `${bookZh} ${chapter}:${verseRange}`,
    enTitle: `${bookEn || bookZh} ${chapter}:${verseRange}`,
    zhVerses: verseRows.map((r, i) => `${startVerse + i} ${(r[0] || "").trim()}`),
    enVerses: verseRows.map((r, i) => `${startVerse + i} ${(r[1] || "").trim()}`),
  };
}

/**
 * Look up Bible verses from the Google Sheets Bible data source.
 *
 * Accepts single or multi-range refs (e.g. "约 3:16", "林前1:18-25, 2:1-8").
 * Returns one VerseSegment per comma-separated range.
 * Throws if GOOGLE_BIBLE_SHEET_ID or credentials are not configured.
 */
export async function lookupBibleVerses(ref: string): Promise<VerseSegment[]> {
  const bibleSheetId = process.env.GOOGLE_BIBLE_SHEET_ID;
  if (!bibleSheetId) throw new Error("GOOGLE_BIBLE_SHEET_ID is not configured");

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

  const bookNamesList = ((bnRes.data.values || []) as string[][])
    .filter((r) => r[0] && r[2] && r[0] !== "----" && !isNaN(parseInt(r[2], 10)))
    .map((r) => ({ zhName: r[0], enName: r[1] ?? "", bookNum: parseInt(r[2], 10) }))
    .sort((a, b) => b.zhName.length - a.zhName.length);

  const bibleDataKeys = ((bdRes.data.values || []) as string[][])
    .map((r) => parseInt(r[0] || "0", 10))
    .filter((n) => n > 0);

  // Split multi-range refs; segments starting with a digit re-use the previous book prefix.
  const rawParts = ref.split(/[,;，；]\s*/);
  const segments: string[] = [];
  let bookPrefix = "";
  for (const part of rawParts) {
    const t = part.trim();
    if (!t) continue;
    if (/^\d/.test(t) && bookPrefix) {
      segments.push(bookPrefix + t);
    } else {
      segments.push(t);
      const m = t.match(/^([^\d]+)/);
      if (m) bookPrefix = m[1];
    }
  }

  const results = await Promise.all(
    segments.map((seg) => fetchSingleRef(bibleSheetId, seg, bookNamesList, bibleDataKeys))
  );
  return results.filter((r): r is VerseSegment => r !== null);
}
