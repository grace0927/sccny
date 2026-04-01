export interface HymnEntry {
  number: string;
  title: string;
  raw: string;
  /** True for 回应诗歌 (response hymn); false/absent for all other hymns */
  isResponse?: boolean;
  /** YouTube URL if provided on the hymn line — video slide replaces lyrics slides */
  youtubeUrl?: string;
}

export interface WorshipOrderData {
  /** List of hymns (including response hymns), in order */
  hymns: HymnEntry[];
  /** Scripture reading reference, e.g. "哥林多前书第五章" */
  scriptureReading: string;
  /** Memory verse reference, e.g. "帖撒罗尼迦前书4：3-5" */
  memoryVerse: string;
  /** Sermon title, e.g. "证道题目" */
  sermonTitle: string;
  /** Sermon subtitle (second quoted string on the sermon title line), if any */
  sermonSubtitle: string;
  /** Speaker / preacher name → summary!B3 */
  speaker: string;
  /** Call to worship scripture ref */
  callToWorship: string;
  /** Confession prayer scripture ref */
  confessionPrayer: string;
  /** Assurance scripture ref */
  assuranceOfPardon: string;
  /** Whether communion is included (detected if lines contain 圣餐) */
  hasCommunion: boolean;
  /** Raw lines that were not parsed into a known field */
  otherLines: string[];
}

/**
 * Parse a hymn line like "诗歌：12 你真伟大" or "回应诗歌：441 洁净我"
 * Returns { number, title, raw } or null if not parseable.
 */
function extractYouTubeUrl(text: string): { youtubeUrl: string; textWithoutUrl: string } | null {
  const match = text.match(/\s+(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s]*v=|youtu\.be\/)[^\s]+)/);
  if (!match) return null;
  return {
    youtubeUrl: match[1],
    textWithoutUrl: text.slice(0, match.index!).trim(),
  };
}

function parseHymnLine(text: string): HymnEntry | null {
  // text is already stripped of the prefix (e.g. "12 你真伟大")
  const trimmed = text.trim();
  const extracted = extractYouTubeUrl(trimmed);
  const cleanText = extracted ? extracted.textWithoutUrl : trimmed;
  const match = cleanText.match(/^(\d+)\s+(.+)$/);
  if (!match) return null;
  return {
    number: match[1],
    title: match[2].trim(),
    raw: trimmed,
    ...(extracted ? { youtubeUrl: extracted.youtubeUrl } : {}),
  };
}

/**
 * Parse a worship order text (one item per line) into structured data.
 *
 * Supported prefixes:
 *   诗歌：        → hymn
 *   回应诗歌：    → hymn (response)
 *   经文：        → scripture reading
 *   金句：        → memory verse
 *   主日证道题目：→ sermon title + speaker
 *   宣召：        → call to worship
 *   认罪祷告：    → confession prayer
 *   宣告赦免：    → assurance of pardon
 *   圣餐 (anywhere in line) → hasCommunion = true
 */
export function parseWorshipOrder(text: string): WorshipOrderData {
  const result: WorshipOrderData = {
    hymns: [],
    scriptureReading: "",
    memoryVerse: "",
    sermonTitle: "",
    sermonSubtitle: "",
    speaker: "",
    callToWorship: "",
    confessionPrayer: "",
    assuranceOfPardon: "",
    hasCommunion: false,
    otherLines: [],
  };

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let pastSermon = false;

  for (const line of lines) {
    // Detect communion
    if (line.includes("圣餐") || line.includes("聖餐")) {
      result.hasCommunion = true;
    }

    // Track when we've passed the sermon line so subsequent 诗歌 become response hymns
    if (line.startsWith("主日证道题目：") || line.startsWith("主日證道題目：") ||
        line.startsWith("证道") || line.startsWith("證道")) {
      pastSermon = true;
    }

    if (line.startsWith("诗歌：") || line.startsWith("詩歌：")) {
      const rest = line.replace(/^[詩诗]歌：/, "");
      const hymn = parseHymnLine(rest);
      if (hymn) result.hymns.push(pastSermon ? { ...hymn, isResponse: true } : hymn);
      else result.otherLines.push(line);
    } else if (line.startsWith("回应诗歌：") || line.startsWith("回應詩歌：")) {
      const rest = line.replace(/^回[應应][詩诗]歌：/, "");
      const hymn = parseHymnLine(rest);
      if (hymn) result.hymns.push({ ...hymn, isResponse: true });
      else result.otherLines.push(line);
    } else if (line.startsWith("经文：") || line.startsWith("經文：")) {
      result.scriptureReading = line.replace(/^[經经]文：/, "").trim();
    } else if (line.startsWith("金句：")) {
      result.memoryVerse = line.replace(/^金句：/, "").trim();
    } else if (line.startsWith("主日证道题目：") || line.startsWith("主日證道題目：")) {
      const rest = line.replace(/^主日[证證]道[题題]目：/, "").trim();
      // Extract sermon title from first "..." quotes
      const titleMatch = rest.match(/["""「](.*?)["""」]/);
      if (titleMatch) {
        result.sermonTitle = titleMatch[1].trim();
        const afterTitle = rest.slice(rest.lastIndexOf(titleMatch[0]) + titleMatch[0].length).trim();
        // Check for optional subtitle in a second set of quotes
        const subtitleMatch = afterTitle.match(/["""「](.*?)["""」]/);
        if (subtitleMatch) {
          result.sermonSubtitle = subtitleMatch[1].trim();
        }
      } else {
        // No quotes — take whole text as title
        result.sermonTitle = rest;
      }
    } else if (line.startsWith("宣召：")) {
      result.callToWorship = line.replace(/^宣召：/, "").trim();
    } else if (line.startsWith("认罪祷告：") || line.startsWith("認罪禱告：")) {
      result.confessionPrayer = line.replace(/^[认認]罪[祷禱]告：/, "").trim();
    } else if (line.startsWith("宣告赦免：")) {
      result.assuranceOfPardon = line.replace(/^宣告赦免：/, "").trim();
    } else {
      result.otherLines.push(line);
    }
  }

  return result;
}

/** Default worship order template text shown in the textarea */
export const DEFAULT_WORSHIP_ORDER_TEMPLATE = `序乐 Prelude  会众静默（9:57 - 10:00am)
宣召：诗篇51
诗歌：12 你真伟大
会众祷告
认罪祷告：诗篇32：5
宣告赦免：罗马书8：1-2
诗歌：173 宝血活泉
经文：哥林多前书第五章
金句：帖撒罗尼迦前书4：3-5
主日证道题目： "证道题目"   讲员姓名牧师
回应诗歌：441 洁净我
欢迎与报告
奉献与奉献祷告
结束祷告与祝福
赞美诗`;
