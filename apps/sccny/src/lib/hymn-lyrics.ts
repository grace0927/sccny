// Server-only helpers that fetch hymn lyrics from public web sources.
// Chinese lyrics: christianstudy.com 生命聖詩 pages (Big5-encoded, Traditional Chinese).
// English lyrics: hymnary.org text-authority pages.
// Both return null on any fetch/parse failure — callers treat that as "not found".

const CHRISTIANSTUDY_BASE = "https://www.christianstudy.com/data/hymns/text";
const HYMNARY_BASE = "https://hymnary.org";
const FETCH_TIMEOUT_MS = 10_000;

export interface ChineseLyricsResult {
  titleZh: string;
  lyricsZh: string;
  sourceUrl: string;
}

export interface EnglishLyricsResult {
  titleEn: string;
  lyricsEn: string;
  sourceUrl: string;
}

/** Strip HTML tags and decode the handful of entities these pages use. */
function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8217;|&rsquo;/gi, "’");
}

/** Collapse whitespace inside lines and drop empty lines. */
function cleanStanza(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Fetch Traditional-Chinese lyrics for a 生命聖詩 hymn number from
 * christianstudy.com. Pages are Big5-encoded; verses are an <ol> of <li>
 * blocks with an optional 副歌 (chorus) line after the list.
 * Stanzas in the result are separated by blank lines.
 */
export async function fetchChineseLyrics(
  number: number
): Promise<ChineseLyricsResult | null> {
  const sourceUrl = `${CHRISTIANSTUDY_BASE}/life${String(number).padStart(3, "0")}.html`;
  try {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!res.ok) return null;
    const html = new TextDecoder("big5").decode(await res.arrayBuffer());

    const titleMatch = html.match(/【([^】]+)】/);
    if (!titleMatch) return null;
    const titleZh = titleMatch[1].trim();

    const olMatch = html.match(/<ol>([\s\S]*?)<\/ol>/i);
    if (!olMatch) return null;

    const stanzas = olMatch[1]
      .split(/<li[^>]*>/i)
      .map((chunk) => cleanStanza(stripTags(chunk)))
      .filter((s) => s.length > 0);
    if (stanzas.length === 0) return null;

    // Chorus appears as a "副歌：…" line (possibly multi-line) after the </ol>,
    // before the embedded midi <script> / copyright footer.
    const afterOl = html
      .slice(html.indexOf(olMatch[0]) + olMatch[0].length)
      .split(/<script/i)[0];
    const afterLines = cleanStanza(stripTags(afterOl)).split("\n");
    const chorusStart = afterLines.findIndex((line) => /^副歌[：:]/.test(line));
    if (chorusStart !== -1) {
      const chorusLines: string[] = [];
      for (const line of afterLines.slice(chorusStart)) {
        if (/版權/.test(line)) break;
        chorusLines.push(line);
      }
      if (chorusLines.length > 0) stanzas.push(chorusLines.join("\n"));
    }

    return { titleZh, lyricsZh: stanzas.join("\n\n"), sourceUrl };
  } catch {
    return null;
  }
}

/**
 * Fetch English lyrics from hymnary.org: search by title, follow the first
 * /text/{slug} authority link, and extract the "Representative Text" block
 * (one <p> per stanza; the last <p> is a source-hymnal attribution and is
 * dropped). Stanza-number prefixes like "1 " are stripped.
 */
export async function fetchEnglishLyrics(
  titleEn: string
): Promise<EnglishLyricsResult | null> {
  try {
    const searchUrl = `${HYMNARY_BASE}/search?qu=${encodeURIComponent(titleEn)}`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!searchRes.ok) return null;
    const searchHtml = await searchRes.text();

    // The first /text/{slug} occurrence on the results page is the top-ranked
    // text authority (links are not always plain href attributes).
    const linkMatch = searchHtml.match(/\/text\/[a-z0-9_]+/i);
    if (!linkMatch) return null;

    const textUrl = `${HYMNARY_BASE}${linkMatch[0]}`;
    const textRes = await fetch(textUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!textRes.ok) return null;
    const textHtml = await textRes.text();

    const blockMatch = textHtml.match(/<div property='text'>([\s\S]*?)<\/div><div class="authority_bottom_bar">/);
    if (!blockMatch) return null;

    const paragraphs = blockMatch[1]
      .split(/<p[^>]*>/i)
      .map((chunk) => cleanStanza(stripTags(chunk)))
      .filter((s) => s.length > 0);
    // Last paragraph is the source attribution (e.g. "Psalter Hymnal (Gray), 1987")
    if (paragraphs.length > 1) paragraphs.pop();
    if (paragraphs.length === 0) return null;

    const stanzas = paragraphs.map((s) => s.replace(/^\d+\s+/, ""));

    const pageTitleMatch = textHtml.match(/<title>([^|<]+)/);
    const resolvedTitle = pageTitleMatch ? stripTags(pageTitleMatch[1]).trim() : titleEn;

    return { titleEn: resolvedTitle, lyricsEn: stanzas.join("\n\n"), sourceUrl: textUrl };
  } catch {
    return null;
  }
}
