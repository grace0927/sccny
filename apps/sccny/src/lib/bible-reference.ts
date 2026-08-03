/**
 * Bible reference parsing — pure, no I/O.
 *
 * Deliberately free of `server-only` and `googleapis` imports so it can be unit
 * tested and (if ever needed) reused on the client. All Google Sheets access
 * lives in `bible-lookup.ts`, which is the only intended consumer alongside
 * `google-slides.ts`.
 *
 * Supported input forms (all resolve to the same canonical Simplified book):
 *   约3:16        约翰福音 3:16        John 3:16      Jn 3:16
 *   约翰福音1:1-2:2                     John 1:1-2:2   (cross-chapter)
 *   詩篇51        诗篇第五十一篇        Ps 23          (whole chapter)
 *   約翰壹書1:9   约翰壹书1:9           1 Jn 1:9       (Traditional + numeral variants)
 *   林前1:18-25, 2:1-8                   (multi-range, book carried over)
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface BookName {
  zhName: string;
  enName: string;
  bookNum: number;
}

/** bookNum → chapter → last verse number in that chapter. */
export type BibleBounds = Map<number, Map<number, number>>;

/** A fully resolved, bounds-validated reference range. */
export interface ParsedRef {
  bookNum: number;
  bookZh: string;
  bookEn: string;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
  /** True when the reference named no verses (e.g. 诗篇51) — whole chapter(s). */
  wholeChapter: boolean;
}

export type BibleRefErrorCode =
  | "UNPARSEABLE"
  | "UNKNOWN_BOOK"
  | "CHAPTER_OUT_OF_RANGE"
  | "VERSE_OUT_OF_RANGE"
  | "REVERSED_RANGE";

export class BibleReferenceError extends Error {
  readonly code: BibleRefErrorCode;
  /** The offending segment, as the user typed it. */
  readonly ref: string;
  readonly params: Record<string, string | number>;

  constructor(
    code: BibleRefErrorCode,
    ref: string,
    message: string,
    params: Record<string, string | number> = {}
  ) {
    super(message);
    this.name = "BibleReferenceError";
    this.code = code;
    this.ref = ref;
    this.params = params;
  }
}

/** One resolved passage: the title plus its verse text in both languages. */
export interface VerseSegment {
  /** e.g. "约翰福音 1:1-2:2" */
  zhTitle: string;
  /** e.g. "John 1:1-2:2" */
  enTitle: string;
  /** Each entry is "{verseLabel} {text}"; the label carries the chapter across chapter boundaries. */
  zhVerses: string[];
  enVerses: string[];
}

/** bibleData column A key scheme: bookNum*1e6 + chapter*1e3 + verse. */
export const verseKey = (bookNum: number, chapter: number, verse: number): number =>
  bookNum * 1_000_000 + chapter * 1_000 + verse;

// ── Chinese variant normalisation ────────────────────────────────────────────

/**
 * Traditional → Simplified for exactly the characters that occur in the 66 book
 * names and their common abbreviations. Deliberately NOT a general converter:
 * a bounded map cannot corrupt unrelated text.
 */
const TRAD_TO_SIMP: Record<string, string> = {
  "創": "创", "記": "记", "紀": "纪", "數": "数", "約": "约", "書": "书",
  "亞": "亚", "師": "师", "歷": "历", "誌": "志", "詩": "诗", "傳": "传",
  "賽": "赛", "結": "结", "彌": "弥", "鴻": "鸿", "該": "该", "瑪": "玛",
  "馬": "马", "羅": "罗", "後": "后", "門": "门", "來": "来", "猶": "犹",
  "啟": "启", "錄": "录",
  // numeral variants used in 约翰壹书 / 约翰贰书 / 约翰叁书
  "壹": "一", "貳": "二", "贰": "二", "叁": "三", "參": "三", "参": "三",
};

const TRAD_RE = new RegExp(`[${Object.keys(TRAD_TO_SIMP).join("")}]`, "g");

/** Normalise Traditional characters and formal numerals to the Simplified forms the sheet uses. */
export function normalizeBookVariants(ref: string): string {
  return ref.replace(TRAD_RE, (c) => TRAD_TO_SIMP[c] ?? c);
}

// ── Chinese abbreviations ────────────────────────────────────────────────────

/**
 * Common Simplified abbreviations → canonical full names.
 * Traditional forms are handled upstream by normalizeBookVariants(), so they
 * deliberately do not appear here.
 */
const BOOK_ABBREV_MAP: Record<string, string> = {
  "林前": "哥林多前书", "林后": "哥林多后书",
  "帖前": "帖撒罗尼迦前书", "帖后": "帖撒罗尼迦后书",
  "提前": "提摩太前书",    "提后": "提摩太后书",
  "彼前": "彼得前书",      "彼后": "彼得后书",
  "撒上": "撒母耳记上",    "撒下": "撒母耳记下",
  "王上": "列王纪上",      "王下": "列王纪下",
  "代上": "历代志上",      "代下": "历代志下",
  "约一": "约翰一书",      "约二": "约翰二书",   "约三": "约翰三书",
  "弗":   "以弗所书",      "腓": "腓立比书",     "西": "歌罗西书",
  "多":   "提多书",        "门": "腓利门书",     "来": "希伯来书",
  "雅":   "雅各书",        "犹": "犹大书",       "启": "启示录",
  "罗":   "罗马书",        "加": "加拉太书",
  "太":   "马太福音",      "可": "马可福音",     "路": "路加福音",
  "约":   "约翰福音",      "徒": "使徒行传",
  "创":   "创世记",        "出": "出埃及记",     "利": "利未记",
  "民":   "民数记",        "申": "申命记",       "书": "约书亚记",
  "士":   "士师记",        "得": "路得记",       "拉": "以斯拉记",
  "尼":   "尼希米记",      "斯": "以斯帖记",     "伯": "约伯记",
  "诗":   "诗篇",          "传": "传道书",       "歌": "雅歌",
  "赛":   "以赛亚书",      "耶": "耶利米书",     "哀": "耶利米哀歌",
  "结":   "以西结书",      "但": "但以理书",     "何": "何西阿书",
  "珥":   "约珥书",        "摩": "阿摩司书",     "俄": "俄巴底亚书",
  "拿":   "约拿书",        "弥": "弥迦书",       "鸿": "那鸿书",
  "哈":   "哈巴谷书",      "番": "西番雅书",     "该": "哈该书",
  "亚":   "撒迦利亚书",    "玛": "玛拉基书",
};

// Pre-sort longest-first so short prefixes don't shadow longer ones.
const ABBREV_ENTRIES = Object.entries(BOOK_ABBREV_MAP).sort((a, b) => b[0].length - a[0].length);

/**
 * Expand an abbreviation at the start of a reference, e.g. "林前1:18" → "哥林多前书1:18".
 * Only expands when what follows is a digit, 第, whitespace or a colon, so full
 * names like "以弗所书" are never corrupted.
 */
export function expandBookAbbreviation(ref: string): string {
  for (const [abbrev, full] of ABBREV_ENTRIES) {
    if (!ref.startsWith(abbrev)) continue;
    const after = ref.slice(abbrev.length);
    if (after === "" || /^[\d第\s：:]/.test(after)) return full + after;
  }
  return ref;
}

// ── Chinese numerals & chapter/verse markers ─────────────────────────────────

const CN_DIGITS: Record<string, number> = {
  "零": 0, "一": 1, "二": 2, "三": 3, "四": 4,
  "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
};

/** Parse Chinese numerals up to 999 ("一百一十九" → 119). Returns null if not numeric. */
export function cnNumToInt(s: string): number | null {
  if (!s) return null;
  if (/^\d+$/.test(s)) return parseInt(s, 10);

  let total = 0;
  let section = 0;
  let sawDigit = false;

  for (const ch of s) {
    if (ch in CN_DIGITS) {
      section = CN_DIGITS[ch];
      sawDigit = true;
    } else if (ch === "十") {
      section = (section === 0 ? 1 : section) * 10;
      total += section;
      section = 0;
      sawDigit = true;
    } else if (ch === "百") {
      section = (section === 0 ? 1 : section) * 100;
      total += section;
      section = 0;
      sawDigit = true;
    } else {
      return null;
    }
  }
  if (!sawDigit) return null;
  return total + section;
}

/**
 * Normalise Chinese chapter/verse markers to the ASCII `chapter:verse` form:
 *   "第五章"         → "5"
 *   "第七章1-40"     → "7:1-40"
 *   "1章1节-2章2节"  → "1:1-2:2"
 *   "第五十一篇"      → "51"
 * Note "诗篇" is safe: the 篇 rules only fire when a digit precedes the marker.
 */
export function normalizeChapterRef(ref: string): string {
  let s = ref;
  // 第<cn-num><marker> → <digits><marker>
  s = s.replace(/第\s*([零一二三四五六七八九十百]+)\s*([章篇节節])/g, (whole, cn: string, marker: string) => {
    const n = cnNumToInt(cn);
    return n === null ? whole : `${n}${marker}`;
  });
  s = s.replace(/第\s*(\d+)\s*([章篇节節])/g, "$1$2");
  // "7章1" → "7:1" (chapter marker acting as the chapter/verse separator)
  s = s.replace(/(\d)\s*[章篇]\s*(?=\d)/g, "$1:");
  // trailing chapter marker with no verse after it → drop
  s = s.replace(/(\d)\s*[章篇]/g, "$1");
  // verse markers are decoration once the numbers are positional
  s = s.replace(/(\d)\s*[节節]/g, "$1");
  return s;
}

// ── English book names ───────────────────────────────────────────────────────

/** Canonical key: lowercase, no spaces/periods, leading ordinal folded to a digit. */
export function canonicalizeEnBook(name: string): string {
  let s = name.trim().toLowerCase().replace(/\./g, "");
  s = s.replace(/^(iii|3rd|third)\s+/, "3 ");
  s = s.replace(/^(ii|2nd|second)\s+/, "2 ");
  s = s.replace(/^(i|1st|first)\s+/, "1 ");
  return s.replace(/\s+/g, "");
}

/** English names and abbreviations → book number (1–66). */
const EN_ALIASES: Record<number, string[]> = {
  1: ["genesis", "gen", "ge", "gn"],
  2: ["exodus", "exod", "exo", "ex"],
  3: ["leviticus", "lev", "le", "lv"],
  4: ["numbers", "num", "nu", "nm", "nb"],
  5: ["deuteronomy", "deut", "deu", "dt", "de"],
  6: ["joshua", "josh", "jos", "jsh"],
  7: ["judges", "judg", "jdg", "jg"],
  8: ["ruth", "rth", "ru"],
  9: ["1samuel", "1sam", "1sa", "1sm"],
  10: ["2samuel", "2sam", "2sa", "2sm"],
  11: ["1kings", "1kgs", "1kin", "1ki"],
  12: ["2kings", "2kgs", "2kin", "2ki"],
  13: ["1chronicles", "1chron", "1chr", "1ch"],
  14: ["2chronicles", "2chron", "2chr", "2ch"],
  15: ["ezra", "ezr"],
  16: ["nehemiah", "neh", "ne"],
  17: ["esther", "esth", "est", "es"],
  18: ["job", "jb"],
  19: ["psalms", "psalm", "psa", "pss", "psm", "ps"],
  20: ["proverbs", "prov", "pro", "prv", "pr"],
  21: ["ecclesiastes", "eccles", "eccl", "ecc", "ec", "qoh"],
  22: ["songofsolomon", "songofsongs", "canticles", "song", "sng", "sos"],
  23: ["isaiah", "isa", "is"],
  24: ["jeremiah", "jer", "je", "jr"],
  25: ["lamentations", "lam", "la"],
  26: ["ezekiel", "ezek", "eze", "ezk"],
  27: ["daniel", "dan", "da", "dn"],
  28: ["hosea", "hos", "ho"],
  29: ["joel", "joe", "jl"],
  30: ["amos", "amo", "am"],
  31: ["obadiah", "obad", "oba", "ob"],
  32: ["jonah", "jon", "jnh"],
  33: ["micah", "mic", "mc"],
  34: ["nahum", "nah", "na"],
  35: ["habakkuk", "hab", "hb"],
  36: ["zephaniah", "zeph", "zep", "zp"],
  37: ["haggai", "hag", "hg"],
  38: ["zechariah", "zech", "zec", "zc"],
  39: ["malachi", "mal", "ml"],
  40: ["matthew", "matt", "mat", "mt"],
  41: ["mark", "mrk", "mar", "mk", "mr"],
  42: ["luke", "luk", "lk", "lu"],
  43: ["john", "jhn", "joh", "jn"],
  44: ["acts", "act", "ac"],
  45: ["romans", "rom", "ro", "rm"],
  46: ["1corinthians", "1cor", "1co"],
  47: ["2corinthians", "2cor", "2co"],
  48: ["galatians", "gal", "ga"],
  49: ["ephesians", "ephes", "eph"],
  50: ["philippians", "philip", "phil", "php", "pp"],
  51: ["colossians", "col"],
  52: ["1thessalonians", "1thess", "1thes", "1th"],
  53: ["2thessalonians", "2thess", "2thes", "2th"],
  54: ["1timothy", "1tim", "1ti"],
  55: ["2timothy", "2tim", "2ti"],
  56: ["titus", "tit", "ti"],
  57: ["philemon", "philem", "phlm", "phm", "pm"],
  58: ["hebrews", "heb"],
  59: ["james", "jas", "jm"],
  60: ["1peter", "1pet", "1pe", "1pt"],
  61: ["2peter", "2pet", "2pe", "2pt"],
  62: ["1john", "1jhn", "1joh", "1jn", "1jo"],
  63: ["2john", "2jhn", "2joh", "2jn", "2jo"],
  64: ["3john", "3jhn", "3joh", "3jn", "3jo"],
  65: ["jude", "jud", "jd"],
  66: ["revelation", "revelations", "apocalypse", "rev", "re"],
};

const EN_ALIAS_TO_BOOKNUM: Map<string, number> = new Map(
  Object.entries(EN_ALIASES).flatMap(([num, aliases]) =>
    aliases.map((a) => [a, parseInt(num, 10)] as [string, number])
  )
);

/** Leading English book token: optional ordinal + one or more words, optional trailing period. */
const EN_BOOK_RE = /^\s*((?:[1-3]|i{1,3}|1st|2nd|3rd|first|second|third)?\s*[a-z]+(?:\s+(?:of\s+)?[a-z]+)*)\.?\s*/i;

// ── Book matching ────────────────────────────────────────────────────────────

function matchBook(
  input: string,
  books: BookName[]
): { book: BookName; rest: string } | null {
  const byNum = new Map(books.map((b) => [b.bookNum, b]));

  // 1. Chinese — full names first (longest wins), then abbreviations.
  const zhSorted = [...books].sort((a, b) => b.zhName.length - a.zhName.length);
  const expanded = expandBookAbbreviation(input);
  for (const book of zhSorted) {
    if (expanded.startsWith(book.zhName)) {
      return { book, rest: expanded.slice(book.zhName.length).trimStart() };
    }
  }

  // 2. English — the sheet's own spelling, then the alias table.
  const m = input.match(EN_BOOK_RE);
  if (m) {
    const rest = input.slice(m[0].length);
    // Try progressively shorter word runs so "Song of Solomon 2" and "Song 2" both work.
    const words = m[1].trim().split(/\s+/);
    for (let take = words.length; take >= 1; take--) {
      const candidate = canonicalizeEnBook(words.slice(0, take).join(" "));
      const trailing = words.slice(take).join(" ");
      const remainder = (trailing ? `${trailing} ` : "") + rest;

      const sheetMatch = books.find(
        (b) => b.enName && canonicalizeEnBook(b.enName) === candidate
      );
      if (sheetMatch) return { book: sheetMatch, rest: remainder.trim() };

      const bookNum = EN_ALIAS_TO_BOOKNUM.get(candidate);
      const aliasMatch = bookNum !== undefined ? byNum.get(bookNum) : undefined;
      if (aliasMatch) return { book: aliasMatch, rest: remainder.trim() };
    }
  }

  return null;
}

// ── Segment parsing ──────────────────────────────────────────────────────────

/**
 * chapter [章] [ : verse ] [ (-|~|–|—|至) [ chapter : ] verse ]
 *
 * Prefix-anchored but not end-anchored, matching the previous parser, so trailing
 * annotations in a worship order don't break the reference.
 */
const TAIL_RE = /^(\d+)(?:\s*[:：]\s*(\d+))?(?:\s*[-~–—至]\s*(?:(\d+)\s*[:：]\s*)?(\d+))?/;

interface RawRef {
  bookNum: number;
  bookZh: string;
  bookEn: string;
  startChapter: number;
  /** null when no verse was given — whole chapter. */
  startVerse: number | null;
  endChapter: number | null;
  endVerse: number | null;
}

function parseSegment(segment: string, books: BookName[]): RawRef {
  const normalized = normalizeChapterRef(normalizeBookVariants(segment.trim()));
  const matched = matchBook(normalized, books);
  if (!matched) {
    throw new BibleReferenceError(
      "UNKNOWN_BOOK",
      segment,
      `无法识别经卷：「${segment.trim()}」`,
      { ref: segment.trim() }
    );
  }

  const { book, rest } = matched;
  const m = rest.match(TAIL_RE);
  if (!m) {
    throw new BibleReferenceError(
      "UNPARSEABLE",
      segment,
      `无法解析经文引用：「${segment.trim()}」`,
      { ref: segment.trim() }
    );
  }

  const startChapter = parseInt(m[1], 10);
  const startVerse = m[2] ? parseInt(m[2], 10) : null;
  let endChapter: number | null = m[3] ? parseInt(m[3], 10) : null;
  let endVerse: number | null = m[4] ? parseInt(m[4], 10) : null;

  // A bare tail number means an end verse when a start verse was given
  // ("约3:16-18"), and an end chapter when one wasn't ("约翰福音1-2").
  if (endVerse !== null && endChapter === null && startVerse === null) {
    endChapter = endVerse;
    endVerse = null;
  }

  return {
    bookNum: book.bookNum,
    bookZh: book.zhName,
    bookEn: book.enName,
    startChapter,
    startVerse,
    endChapter,
    endVerse,
  };
}

// ── Bounds ───────────────────────────────────────────────────────────────────

/** Derive bookNum → chapter → last verse from the sorted bibleData key column. */
export function buildBounds(keys: number[]): BibleBounds {
  const bounds: BibleBounds = new Map();
  for (const key of keys) {
    const bookNum = Math.floor(key / 1_000_000);
    const chapter = Math.floor((key % 1_000_000) / 1_000);
    const verse = key % 1_000;
    let chapters = bounds.get(bookNum);
    if (!chapters) {
      chapters = new Map();
      bounds.set(bookNum, chapters);
    }
    const known = chapters.get(chapter);
    if (known === undefined || verse > known) chapters.set(chapter, verse);
  }
  return bounds;
}

function lastChapter(chapters: Map<number, number>): number {
  let max = 0;
  for (const chapter of chapters.keys()) if (chapter > max) max = chapter;
  return max;
}

/** Book names for the error payload, so a client can localise the message. */
function bookParams(raw: RawRef): Record<string, string> {
  return { book: raw.bookZh, bookEn: raw.bookEn || raw.bookZh };
}

function assertChapter(
  raw: RawRef,
  chapters: Map<number, number>,
  chapter: number,
  segment: string
): number {
  const maxVerse = chapters.get(chapter);
  if (maxVerse === undefined) {
    const maxChapter = lastChapter(chapters);
    throw new BibleReferenceError(
      "CHAPTER_OUT_OF_RANGE",
      segment,
      `${raw.bookZh} 只有 ${maxChapter} 章（引用为第 ${chapter} 章）`,
      { ...bookParams(raw), chapter, maxChapter }
    );
  }
  return maxVerse;
}

function assertVerse(
  raw: RawRef,
  chapter: number,
  verse: number,
  maxVerse: number,
  segment: string
): void {
  if (verse < 1 || verse > maxVerse) {
    throw new BibleReferenceError(
      "VERSE_OUT_OF_RANGE",
      segment,
      `${raw.bookZh} ${chapter} 章只有 ${maxVerse} 节（引用为第 ${verse} 节）`,
      { ...bookParams(raw), chapter, verse, maxVerse }
    );
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Split a multi-range reference on ASCII/full-width commas and semicolons. */
export function splitRefSegments(ref: string): string[] {
  return ref
    .split(/[,;，；]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Parse and bounds-validate a reference string into one range per segment.
 *
 * All-or-nothing: if any segment names a book, chapter or verse that does not
 * exist, the whole call throws. Returning the segments that happened to resolve
 * is exactly the "silently wrong verses" behaviour this replaces.
 *
 * @throws BibleReferenceError
 */
export function resolveRef(ref: string, books: BookName[], bounds: BibleBounds): ParsedRef[] {
  const segments = splitRefSegments(ref);
  if (segments.length === 0) {
    throw new BibleReferenceError("UNPARSEABLE", ref, `无法解析经文引用：「${ref.trim()}」`, {
      ref: ref.trim(),
    });
  }

  const resolved: ParsedRef[] = [];
  let lastBook: BookName | null = null;

  for (const segment of segments) {
    let raw: RawRef;
    try {
      raw = parseSegment(segment, books);
    } catch (err) {
      // "林前1:18-25, 2:1-8" — a chapter-only continuation re-uses the previous book.
      const continuation =
        err instanceof BibleReferenceError &&
        err.code === "UNKNOWN_BOOK" &&
        lastBook !== null &&
        /^\d/.test(segment.trim());
      if (!continuation) throw err;
      raw = parseSegment(`${lastBook!.zhName}${segment.trim()}`, books);
    }

    lastBook = { zhName: raw.bookZh, enName: raw.bookEn, bookNum: raw.bookNum };

    const chapters = bounds.get(raw.bookNum);
    if (!chapters || chapters.size === 0) {
      throw new BibleReferenceError(
        "UNKNOWN_BOOK",
        segment,
        `无法识别经卷：「${segment.trim()}」`,
        { ref: segment.trim() }
      );
    }

    const startChapter = raw.startChapter;
    const startMaxVerse = assertChapter(raw, chapters, startChapter, segment);
    const endChapter = raw.endChapter ?? startChapter;
    const endMaxVerse =
      endChapter === startChapter ? startMaxVerse : assertChapter(raw, chapters, endChapter, segment);

    // TAIL_RE only captures an end chapter alongside an end verse, so a missing
    // end verse means either "whole chapter(s)" or a single verse.
    const wholeChapter = raw.startVerse === null;
    const startVerse = raw.startVerse ?? 1;
    const endVerse = raw.endVerse ?? (wholeChapter ? endMaxVerse : startVerse);

    assertVerse(raw, startChapter, startVerse, startMaxVerse, segment);
    assertVerse(raw, endChapter, endVerse, endMaxVerse, segment);

    if (verseKey(raw.bookNum, endChapter, endVerse) < verseKey(raw.bookNum, startChapter, startVerse)) {
      throw new BibleReferenceError(
        "REVERSED_RANGE",
        segment,
        `经文范围起止颠倒：${raw.bookZh} ${startChapter}:${startVerse}-${endChapter}:${endVerse}`,
        { ...bookParams(raw), ref: segment.trim() }
      );
    }

    resolved.push({
      bookNum: raw.bookNum,
      bookZh: raw.bookZh,
      bookEn: raw.bookEn,
      startChapter,
      startVerse,
      endChapter,
      endVerse,
      wholeChapter,
    });
  }

  return resolved;
}

/**
 * Human-readable title, e.g. "约翰福音 1:1-2:2" / "John 1:1-2:2".
 * Cross-chapter ranges carry the chapter on both ends; same-chapter ranges don't.
 */
export function formatRefTitle(ref: ParsedRef, lang: "zh" | "en"): string {
  const book = lang === "en" ? ref.bookEn || ref.bookZh : ref.bookZh;
  if (ref.startChapter !== ref.endChapter) {
    return `${book} ${ref.startChapter}:${ref.startVerse}-${ref.endChapter}:${ref.endVerse}`;
  }
  if (ref.startVerse === ref.endVerse) {
    return `${book} ${ref.startChapter}:${ref.startVerse}`;
  }
  return `${book} ${ref.startChapter}:${ref.startVerse}-${ref.endVerse}`;
}

/** Return the last index i where arr[i] <= target; -1 if none. arr must be sorted. */
export function binarySearchLE(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= target) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

/** Exact index of a verse key in the sorted key column, or -1. */
export function indexOfKey(keys: number[], key: number): number {
  const idx = binarySearchLE(keys, key);
  return idx >= 0 && keys[idx] === key ? idx : -1;
}
