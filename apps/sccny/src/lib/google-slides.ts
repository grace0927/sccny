import "server-only";
import { google, type slides_v1 } from "googleapis";
import { Readable } from "stream";
import { fetchSegments, loadBibleIndex } from "./bible-lookup";
import { resolveRef } from "./bible-reference";
import { getGoogleAuth } from "./google-auth";

// ── Auth ──────────────────────────────────────────────────────────────────────

const SLIDES_SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

function getSlidesClient() {
  return google.slides({ version: "v1", auth: getGoogleAuth(SLIDES_SCOPES) });
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getGoogleAuth(SLIDES_SCOPES) });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getGoogleAuth(SLIDES_SCOPES) });
}

// ── Template copy ─────────────────────────────────────────────────────────────

/**
 * Copy a Google Slides template into the output folder and return the new presentation ID.
 */
export async function copyTemplatePresentation(
  title: string,
  templateId: string,
  outputFolderId: string
): Promise<string> {
  const drive = getDriveClient();
  const res = await drive.files.copy({
    fileId: templateId,
    supportsAllDrives: true,
    requestBody: {
      name: title,
      parents: [outputFolderId],
    },
    fields: "id",
  });
  return res.data.id!;
}

// ── Placeholder replacement ───────────────────────────────────────────────────

/**
 * Replace all occurrences of placeholder keys in the presentation using batchUpdate.
 * @param map  e.g. { '{A1}': '20250601', '{B3}': '证道题目' }
 */
export async function replacePlaceholders(
  presentationId: string,
  map: Record<string, string>
): Promise<void> {
  const slides = getSlidesClient();
  const requests = Object.entries(map).map(([find, replace]) => ({
    replaceAllText: {
      containsText: { text: find, matchCase: true },
      replaceText: replace,
    },
  }));

  if (requests.length === 0) return;

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });
}

// ── Communion slide handling ──────────────────────────────────────────────────

/**
 * If hasCommunion is false, delete slides that contain the text "圣餐" (communion).
 * If hasCommunion is true, do nothing (slides stay as-is).
 */
export async function handleCommunionSlides(
  presentationId: string,
  hasCommunion: boolean
): Promise<void> {
  if (hasCommunion) return;

  const slides = getSlidesClient();
  const pres = await slides.presentations.get({ presentationId });
  const allSlides = pres.data.slides || [];

  const communionPageIds: string[] = [];
  for (const slide of allSlides) {
    const pageId = slide.objectId!;
    const elements = slide.pageElements || [];
    // Only treat a slide as a communion slide if it has a SHORT text element
    // (≤ 30 chars) that contains "圣餐" — i.e. a section title/header.
    // Long elements (verse text, navigation bars, footers) that incidentally
    // mention "圣餐" should not trigger deletion of unrelated slides.
    let isCommunionSlide = false;
    for (const el of elements) {
      const text = el.shape?.text?.textElements
        ?.map((te) => te.textRun?.content || "")
        .join("") || "";
      const trimmed = text.trim();
      if ((trimmed.includes("圣餐") || trimmed.includes("聖餐")) && trimmed.length <= 30) {
        isCommunionSlide = true;
        break;
      }
    }
    if (isCommunionSlide) communionPageIds.push(pageId);
  }

  if (communionPageIds.length === 0) return;

  // Diagnostic: log which slides are being deleted so we can verify correctness
  for (const pageId of communionPageIds) {
    const slide = allSlides.find((s) => s.objectId === pageId);
    if (slide) {
      const text = (slide.pageElements || [])
        .map((el) =>
          (el.shape?.text?.textElements || []).map((te) => te.textRun?.content || "").join("")
        )
        .join(" ")
        .slice(0, 200);
      console.log(`handleCommunionSlides: deleting page ${pageId} with text: "${text}"`);
    }
  }

  const requests = communionPageIds.map((objectId) => ({
    deleteObject: { objectId },
  }));

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });
}

// ── Scripture slides ──────────────────────────────────────────────────────────

interface ScriptureRef {
  /** e.g. "哥林多前书5" or "哥林多前书第五章" */
  raw: string;
  /** Display reference shown on slides */
  displayRef: string;
}

/** Paginate text into chunks that fit on a slide (≤240 Chinese chars per slide) */
function paginateText(text: string, maxLen = 240): string[] {
  const pages: string[] = [];
  const lines = text.split("\n");
  let current = "";
  for (const line of lines) {
    const candidate = current ? current + "\n" + line : line;
    if (candidate.length > maxLen && current) {
      pages.push(current.trim());
      current = line;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) pages.push(current.trim());
  return pages.length ? pages : [""];
}

/**
 * Add scripture verse slides from the bibleData Sheet.
 * Each scripture gets one or more text slides inserted at insertIndex.
 *
 * bibleData sheet columns (1-indexed):
 *   B = Chinese verse text, C = English verse text
 *
 * summary tab columns for scripture rows (A42 onwards):
 *   B = bookZh, D = chapter, E = startVerse, F = endVerse, G = bibleDataStartRow, H = bibleDataEndRow, I = bookEn
 */
export async function addScriptureSlides(
  presentationId: string,
  bibleSheetId: string,
  scriptures: ScriptureRef[],
  insertIndex: number
): Promise<void> {
  if (scriptures.length === 0) return;

  const slidesApi = getSlidesClient();
  let currentIndex = insertIndex;

  for (const scripture of scriptures) {
    // Read verse data directly from bibleData tab using the sheet
    // We'll read rows from the summary tab to find the book/chapter/verse range
    const sheets = getSheetsClient();

    // Read summary tab for scripture lookup info (rows 42 onwards have scripture entries)
    const summaryRes = await sheets.spreadsheets.values.get({
      spreadsheetId: bibleSheetId,
      range: "summary!A42:I200",
    });

    const summaryRows = summaryRes.data.values || [];
    // Find the matching row based on displayRef (or raw)
    // Each row: [A, bookZh(B), , chapter(D), startVerse(E), endVerse(F), bibleDataStart(G), bibleDataEnd(H), bookEn(I)]
    let matchedRow: string[] | null = null;
    for (const row of summaryRows) {
      const bookZh = row[1] || "";
      const chapter = row[3] || "";
      // Check if raw reference starts with this book+chapter
      if (scripture.raw.includes(bookZh) && scripture.raw.includes(chapter)) {
        matchedRow = row;
        break;
      }
    }

    let verseText = scripture.displayRef;
    if (matchedRow) {
      const bibleDataStart = parseInt(matchedRow[6] || "0", 10);
      const bibleDataEnd = parseInt(matchedRow[7] || "0", 10);

      if (bibleDataStart > 0 && bibleDataEnd >= bibleDataStart) {
        // Read verse text from bibleData tab
        const bibleRes = await sheets.spreadsheets.values.get({
          spreadsheetId: bibleSheetId,
          range: `bibleData!B${bibleDataStart}:C${bibleDataEnd}`,
        });
        const bibleRows = bibleRes.data.values || [];
        const zhLines = bibleRows.map((r) => r[0] || "").join("\n");
        verseText = zhLines || scripture.displayRef;
      }
    }

    const pages = paginateText(verseText);
    const requests: object[] = [];

    for (let i = 0; i < pages.length; i++) {
      const pageObjId = `scripture_${Date.now()}_${Math.random().toString(36).slice(2)}_${i}`;
      requests.push({
        createSlide: {
          objectId: pageObjId,
          insertionIndex: currentIndex + i,
          slideLayoutReference: { predefinedLayout: "BLANK" },
        },
      });
      requests.push({
        insertText: {
          objectId: pageObjId,
          text: (i === 0 ? scripture.displayRef + "\n\n" : "") + pages[i],
        },
      });
    }

    await slidesApi.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });

    currentIndex += pages.length;
  }
}

// ── YouTube helpers ───────────────────────────────────────────────────────────

/** Extract YouTube video ID from a URL (watch?v=, youtu.be/, or embed/). */
function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// ── Hymn slide copy ───────────────────────────────────────────────────────────

/** Extract slide text for hymn-title matching. */
function slideFullText(slide: slides_v1.Schema$Page): string {
  return (slide.pageElements || [])
    .map((el) =>
      (el.shape?.text?.textElements || [])
        .map((te) => te.textRun?.content || "")
        .join("")
    )
    .join(" ");
}

/** Find page IDs in bankSlides whose text contains hymnTitle. */
function findHymnPageIds(
  bankSlides: slides_v1.Schema$Page[],
  hymnTitle: string
): string[] {
  const matchedIds: string[] = [];
  let inHymn = false;

  for (const slide of bankSlides) {
    const pageId = slide.objectId!;
    const fullText = slideFullText(slide);

    if (fullText.includes(hymnTitle)) {
      inHymn = true;
      matchedIds.push(pageId);
    } else if (inHymn) {
      const trimmed = fullText.trim();
      if (trimmed.match(/^\d+\s/) || trimmed.length < 5) break;
      matchedIds.push(pageId);
    }
  }

  return matchedIds;
}

/** Extract the presentation ID from a Google Slides URL (or accept a bare ID). */
export function extractPresentationId(urlOrId: string): string | null {
  const match = urlOrId.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(urlOrId) ? urlOrId : null;
}

export interface HymnBankIndexEntry {
  number: number;
  titleZh: string;
  titleEn: string;
  /** 0-based page index of the hymn's title slide in the bank presentation */
  startIndex: number;
  /** 0-based page index of its last lyrics slide (inclusive) */
  endIndex: number;
}

/**
 * Scan the hymn bank presentation and locate every hymn's slide range.
 * Title slides are the ones containing the "颂诗 HYMN" marker (the same
 * marker copyHymnSlides matches in the target deck); the slides between one
 * title slide and the next are that hymn's lyrics. A numbered title slide
 * reads "<number>\n<Chinese title>[\n<English title>]"; title slides without
 * a leading hymn number (one-off songs) are skipped for indexing but still
 * terminate the previous hymn's range.
 */
export async function indexHymnBank(hymnBankId: string): Promise<HymnBankIndexEntry[]> {
  const slides = getSlidesClient();
  const res = await slides.presentations.get({ presentationId: hymnBankId });
  const bankSlides = res.data.slides || [];
  const texts = bankSlides.map((s) => slideFullText(s));

  const titleIndexes: number[] = [];
  texts.forEach((t, i) => {
    if (t.includes("颂诗 HYMN")) titleIndexes.push(i);
  });

  const entries: HymnBankIndexEntry[] = [];
  for (let k = 0; k < titleIndexes.length; k++) {
    const startIndex = titleIndexes[k];
    const endIndex = (k + 1 < titleIndexes.length ? titleIndexes[k + 1] : bankSlides.length) - 1;

    const lines = texts[startIndex]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.includes("颂诗 HYMN"));
    if (lines.length === 0) continue;

    // Number on its own line ("3\n求大君王来临") or inline ("3 求大君王来临")
    let number: number;
    let titleZh: string;
    let titleEnLine: string | undefined;
    const inlineMatch = lines[0].match(/^(\d+)\s+(\S.*)$/);
    if (/^\d+$/.test(lines[0])) {
      number = parseInt(lines[0], 10);
      titleZh = lines[1] ?? "";
      titleEnLine = lines[2];
    } else if (inlineMatch) {
      number = parseInt(inlineMatch[1], 10);
      titleZh = inlineMatch[2].trim();
      titleEnLine = lines[1];
    } else {
      continue; // unnumbered title slide — not indexable by hymn number
    }
    if (!titleZh) continue;

    entries.push({
      number,
      titleZh,
      titleEn: titleEnLine && /[A-Za-z]/.test(titleEnLine) ? titleEnLine : "",
      startIndex,
      endIndex,
    });
  }

  return entries;
}

/** A hymn to insert slides for, with optional DB-backed sources. */
export interface HymnSlideSource {
  title: string;
  /** YouTube URL — a video slide replaces lyrics slides */
  youtubeUrl?: string;
  /** Indexed slide range in a bank presentation (from the Hymn table) */
  slidesUrl?: string | null;
  slideStartIndex?: number | null;
  slideEndIndex?: number | null;
  /** Stored lyrics (from the Hymn table) — used when no bank slides exist */
  lyricsZh?: string | null;
  lyricsEn?: string | null;
}

/**
 * Insert hymn LYRICS slides into the target presentation immediately after
 * each hymn's title slide (identified by containing both the hymn title and
 * "颂诗 HYMN"). Per-hymn source priority:
 *  1. youtubeUrl → a YouTube video slide
 *  2. indexed slide range (slidesUrl + slideStartIndex/slideEndIndex) → copy
 *     those bank pages by index (the title slide at startIndex is skipped)
 *  3. title-scan of the default hymn bank (legacy fuzzy match)
 *  4. stored lyrics text → generated bilingual lyric slides
 * Hymns with none of the above are returned as missing.
 */
export async function copyHymnSlides(
  targetPresentationId: string,
  hymnBankId: string,
  hymns: HymnSlideSource[],
): Promise<string[]> {
  const missingHymns: string[] = [];
  if (hymns.length === 0) return missingHymns;

  const slides = getSlidesClient();

  // Source presentations (default bank + any per-hymn slidesUrl) are fetched
  // lazily and cached so several hymns from the same bank cost one API call.
  const presCache = new Map<string, slides_v1.Schema$Page[]>();
  const getSourceSlides = async (presentationId: string): Promise<slides_v1.Schema$Page[]> => {
    let cached = presCache.get(presentationId);
    if (!cached) {
      const res = await slides.presentations.get({ presentationId });
      cached = res.data.slides || [];
      presCache.set(presentationId, cached);
    }
    return cached;
  };

  // Snapshot of the target presentation (for locating title slides)
  const targetPres = await slides.presentations.get({ presentationId: targetPresentationId });
  const targetSlides = targetPres.data.slides || [];
  // The deck's real page size — this template is 4:3, so nothing here may assume 16:9.
  const pageSize = targetPres.data.pageSize;
  const pageWidth = pageSize?.width?.magnitude ?? DEFAULT_PAGE_WIDTH_EMU;
  const pageHeight = pageSize?.height?.magnitude ?? DEFAULT_PAGE_HEIGHT_EMU;

  let insertionOffset = 0; // tracks extra slides inserted so far

  for (const hymn of hymns) {
    const title = hymn.title;

    // Find the hymn title slide in the target presentation:
    // must contain both the hymn title AND "颂诗 HYMN"
    let titleSlideIndex = -1;
    for (let i = 0; i < targetSlides.length; i++) {
      const text = slideFullText(targetSlides[i]);
      if (text.includes(title) && text.includes("颂诗 HYMN")) {
        titleSlideIndex = i;
        break;
      }
    }
    if (titleSlideIndex === -1) {
      console.warn(`copyHymnSlides: no title slide found in target for hymn "${title}"`);
      missingHymns.push(title);
      continue;
    }

    // Insert right after the title slide
    const insertIndex = titleSlideIndex + 1 + insertionOffset;

    // ── YouTube path: insert a video slide, skip lyrics ──────────────────────
    if (hymn.youtubeUrl) {
      const videoId = extractYouTubeId(hymn.youtubeUrl);
      if (!videoId) {
        console.warn(`copyHymnSlides: could not extract YouTube ID from "${hymn.youtubeUrl}"`);
      } else {
        const videoSlideId = `hymn_yt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const videoElemId = `${videoSlideId}_vid`;
        // Fit a 16:9 video inside the deck's page without distorting it, centered.
        const videoWidth = Math.min(pageWidth, (pageHeight * 16) / 9);
        const videoHeight = (videoWidth * 9) / 16;
        await slides.presentations.batchUpdate({
          presentationId: targetPresentationId,
          requestBody: {
            requests: [
              {
                createSlide: {
                  objectId: videoSlideId,
                  insertionIndex: insertIndex,
                  slideLayoutReference: { predefinedLayout: "BLANK" },
                },
              },
              {
                createVideo: {
                  objectId: videoElemId,
                  source: "YOUTUBE",
                  id: videoId,
                  elementProperties: {
                    pageObjectId: videoSlideId,
                    size: {
                      width: { magnitude: videoWidth, unit: "EMU" },
                      height: { magnitude: videoHeight, unit: "EMU" },
                    },
                    transform: {
                      scaleX: 1,
                      scaleY: 1,
                      translateX: (pageWidth - videoWidth) / 2,
                      translateY: (pageHeight - videoHeight) / 2,
                      unit: "EMU",
                    },
                  },
                },
              },
            ],
          },
        });
        insertionOffset++;
      }
      continue;
    }

    // ── Resolve the hymn's source slides ─────────────────────────────────────
    let srcSlides: slides_v1.Schema$Page[] = [];

    // 1) Indexed slide range from the DB (requires at least one lyrics page)
    if (
      hymn.slidesUrl &&
      hymn.slideStartIndex != null &&
      hymn.slideEndIndex != null &&
      hymn.slideEndIndex > hymn.slideStartIndex
    ) {
      const srcPresId = extractPresentationId(hymn.slidesUrl);
      if (srcPresId) {
        try {
          const all = await getSourceSlides(srcPresId);
          // Skip the title slide at startIndex; copy only the lyrics pages
          srcSlides = all.slice(hymn.slideStartIndex + 1, hymn.slideEndIndex + 1);
        } catch (err) {
          console.warn(`copyHymnSlides: failed to load indexed slides for "${title}"`, err);
        }
      }
    }

    // 2) Legacy fuzzy title-scan of the default hymn bank
    if (srcSlides.length === 0 && hymnBankId) {
      try {
        const bankSlides = await getSourceSlides(hymnBankId);
        // Skip the first matched slide (the bank's own title slide)
        const pageIds = findHymnPageIds(bankSlides, title).slice(1);
        srcSlides = pageIds
          .map((id) => bankSlides.find((s) => s.objectId === id))
          .filter((s): s is slides_v1.Schema$Page => !!s);
      } catch (err) {
        console.warn(`copyHymnSlides: hymn bank scan failed for "${title}"`, err);
      }
    }

    if (srcSlides.length > 0) {
      // Insert copied slides right after the title slide
      let currentIndex = insertIndex;
      for (const src of srcSlides) {
        const newSlideId = `hymn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const requests = buildSlideCopyRequests(src, newSlideId, currentIndex);
        await slides.presentations.batchUpdate({
          presentationId: targetPresentationId,
          requestBody: { requests },
        });
        currentIndex++;
        insertionOffset++;
      }
      continue;
    }

    // 3) Stored lyrics → generate bilingual lyric slides
    if (hymn.lyricsZh?.trim()) {
      const inserted = await createLyricsSlides(
        slides,
        targetPresentationId,
        insertIndex,
        hymn.lyricsZh,
        hymn.lyricsEn ?? undefined,
        targetSlides[titleSlideIndex],
        pageWidth,
        pageHeight
      );
      if (inserted > 0) {
        insertionOffset += inserted;
        continue;
      }
    }

    console.warn(`copyHymnSlides: no slides or lyrics found for hymn "${title}"`);
    missingHymns.push(title);
  }
  return missingHymns;
}

/** Build the batchUpdate requests that clone one source slide into the target at insertionIndex. */
function buildSlideCopyRequests(
  src: slides_v1.Schema$Page,
  newSlideId: string,
  insertionIndex: number
): object[] {
  const requests: object[] = [];
  {

      // 1. Create blank slide
      requests.push({
        createSlide: {
          objectId: newSlideId,
          insertionIndex,
          slideLayoutReference: { predefinedLayout: "BLANK" },
        },
      });

      // 2. Copy background fill.
      // Construct a clean object (no propertyState) — passing the raw GET response
      // object with propertyState causes "This request cannot be applied."
      const bgFill = src.pageProperties?.pageBackgroundFill;
      if (bgFill?.solidFill) {
        requests.push({
          updatePageProperties: {
            objectId: newSlideId,
            pageProperties: { pageBackgroundFill: { solidFill: bgFill.solidFill } },
            fields: "pageBackgroundFill",
          },
        });
      } else if (bgFill?.stretchedPictureFill?.contentUrl) {
        requests.push({
          updatePageProperties: {
            objectId: newSlideId,
            pageProperties: {
              pageBackgroundFill: {
                stretchedPictureFill: { contentUrl: bgFill.stretchedPictureFill.contentUrl },
              },
            },
            fields: "pageBackgroundFill",
          },
        });
      }

      // 3. Reconstruct page elements
      for (const el of (src.pageElements || [])) {
        const elId = `el_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        if (el.image) {
          const imageUrl = (el.image as { contentUrl?: string; sourceUrl?: string }).contentUrl
            || (el.image as { contentUrl?: string; sourceUrl?: string }).sourceUrl;
          if (imageUrl) {
            requests.push({
              createImage: {
                objectId: elId,
                url: imageUrl,
                elementProperties: {
                  pageObjectId: newSlideId,
                  size: el.size,
                  transform: el.transform,
                },
              },
            });
          }
        } else if (el.shape) {
          const shapeType = (el.shape as { shapeType?: string }).shapeType || "TEXT_BOX";
          requests.push({
            createShape: {
              objectId: elId,
              shapeType,
              elementProperties: {
                pageObjectId: newSlideId,
                size: el.size,
                transform: el.transform,
              },
            },
          });

          // Copy shape visual properties
          const shapeProps = (el.shape as { shapeProperties?: object }).shapeProperties;
          if (shapeProps) {
            requests.push({
              updateShapeProperties: {
                objectId: elId,
                shapeProperties: shapeProps,
                fields: "shapeBackgroundFill,outline,shadow,contentAlignment",
              },
            });
          }

          // Copy text preserving both paragraph styles (alignment, spacing) and run styles.
          // textElements is a sequence of alternating paragraphMarker + textRun* per paragraph.
          type RawTextElem = {
            paragraphMarker?: { style?: Record<string, unknown> | null } | null;
            textRun?: { content?: string | null; style?: Record<string, unknown> | null } | null;
          };
          const textElements: RawTextElem[] = (
            el.shape as { text?: { textElements?: RawTextElem[] } }
          ).text?.textElements || [];

          // Build paragraphs: [{ paraStyle, runs: [{content, style}] }]
          const paragraphs: Array<{
            paraStyle: Record<string, unknown> | null;
            runs: Array<{ content: string; style?: Record<string, unknown> }>;
          }> = [];
          let curPara: (typeof paragraphs)[0] = { paraStyle: null, runs: [] };
          for (const te of textElements) {
            if ("paragraphMarker" in te) {
              if (curPara.runs.length > 0) paragraphs.push(curPara);
              curPara = { paraStyle: (te.paragraphMarker?.style ?? null), runs: [] };
            } else if (te.textRun?.content) {
              curPara.runs.push({
                content: te.textRun.content,
                style: te.textRun.style ?? undefined,
              });
            }
          }
          if (curPara.runs.length > 0) paragraphs.push(curPara);

          const fullText = paragraphs.flatMap((p) => p.runs.map((r) => r.content)).join("");
          if (fullText.length > 0) {
            requests.push({
              insertText: { objectId: elId, insertionIndex: 0, text: fullText },
            });

            // Only update fields that are actually present in the source style
            const paraStyleFields = [
              "alignment", "lineSpacing", "direction", "spacingMode",
              "spaceAbove", "spaceBelow", "indentFirstLine", "indentStart", "indentEnd",
            ];
            const runStyleFields = [
              "bold", "italic", "underline", "strikethrough", "smallCaps", "baselineOffset",
              "foregroundColor", "backgroundColor", "fontFamily", "fontSize", "weightedFontFamily",
            ];

            let charOffset = 0;
            for (const para of paragraphs) {
              const paraText = para.runs.map((r) => r.content).join("");
              const paraLen = paraText.length;

              // Apply paragraph style (alignment, line spacing, etc.)
              if (para.paraStyle) {
                const fields = paraStyleFields.filter((f) => f in para.paraStyle!).join(",");
                if (fields) {
                  requests.push({
                    updateParagraphStyle: {
                      objectId: elId,
                      style: para.paraStyle,
                      textRange: { type: "FIXED_RANGE", startIndex: charOffset, endIndex: charOffset + paraLen },
                      fields,
                    },
                  });
                }
              }

              // Apply per-run text styles
              let runOffset = charOffset;
              for (const run of para.runs) {
                if (run.style && run.content.length > 0) {
                  const fields = runStyleFields.filter((f) => f in run.style!).join(",");
                  if (fields) {
                    requests.push({
                      updateTextStyle: {
                        objectId: elId,
                        style: run.style,
                        textRange: { type: "FIXED_RANGE", startIndex: runOffset, endIndex: runOffset + run.content.length },
                        fields,
                      },
                    });
                  }
                }
                runOffset += run.content.length;
              }
              charOffset += paraLen;
            }
          }
        }
      }

  }
  return requests;
}

// Page size of the church deck (4:3), used only when the API omits pageSize.
const DEFAULT_PAGE_WIDTH_EMU = 9144000;
const DEFAULT_PAGE_HEIGHT_EMU = 6858000;

// Inset of the lyrics card inside the page, measured from the hymn bank's own
// lyric slides (e.g. 生命圣诗 512 → bank pages 745-747).
const LYRICS_MARGIN_X_EMU = 381000;
const LYRICS_MARGIN_Y_EMU = 449225;

// Type sizes for lyric slides. The first pair (24pt zh / 20pt en) is what the
// hymn bank's own lyric slides use; the smaller pairs are only reached when a
// stanza would otherwise overflow the card.
const LYRICS_SIZE_LADDER: ReadonlyArray<readonly [number, number]> = [
  [24, 20],
  [20, 16],
  [16, 13],
];
const LYRICS_LINE_SPACING = 150;
const PT_TO_EMU = 12700;
/** A rendered line box is taller than its point size; ~1.2x for Microsoft Yahei. */
const LINE_HEIGHT_FACTOR = 1.2;
/** Breathing room inside the card so text never touches its border. */
const LYRICS_TEXT_PADDING_EMU = 274320; // 0.3"

/** Run-style properties copied from the donor slide so lyrics match the deck's typography. */
type DonorRunStyle = Record<string, unknown>;

/**
 * The pieces of a hymn title slide a lyric slide is cloned from: the
 * translucent card, the text box holding the hymn number/title, and any
 * placeholders (the "颂诗 HYMN" header) that a lyric slide should not keep.
 */
interface LyricsDonor {
  slideId: string;
  card: slides_v1.Schema$PageElement | null;
  textBox: slides_v1.Schema$PageElement;
  /** Placeholder elements to remove from the duplicate */
  dropIds: string[];
  runStyle: DonorRunStyle;
}

/** Pick the card / text box / placeholders out of a hymn title slide. */
function findLyricsDonor(slide: slides_v1.Schema$Page | undefined): LyricsDonor | null {
  if (!slide?.objectId) return null;

  let card: slides_v1.Schema$PageElement | null = null;
  let textBox: slides_v1.Schema$PageElement | null = null;
  const dropIds: string[] = [];

  for (const el of slide.pageElements || []) {
    if (!el.objectId || !el.shape) continue;
    // Placeholders carry the slide's own headings ("颂诗 HYMN") — not wanted on lyric slides
    if (el.shape.placeholder) {
      dropIds.push(el.objectId);
      continue;
    }
    const hasText = (el.shape.text?.textElements || []).some((te) =>
      te.textRun?.content?.trim()
    );
    if (hasText) {
      if (!textBox) textBox = el;
    } else if (!card) {
      card = el;
    }
  }
  if (!textBox) return null;

  // Keep the deck's font and color; size and weight are set per stanza.
  const firstRun = (textBox.shape?.text?.textElements || []).find((te) => te.textRun?.style)
    ?.textRun?.style as DonorRunStyle | undefined;
  const runStyle: DonorRunStyle = {};
  for (const key of ["fontFamily", "weightedFontFamily", "foregroundColor"]) {
    if (firstRun && firstRun[key] != null) runStyle[key] = firstRun[key];
  }

  return { slideId: slide.objectId, card, textBox, dropIds, runStyle };
}

/**
 * Absolute transform that places an element at (x, y) with the given rendered
 * size. Slides keeps a base `size` per element and scales it, so the scale
 * factors are derived from that base rather than assumed to be 1.
 */
function absoluteTransform(
  el: slides_v1.Schema$PageElement,
  x: number,
  y: number,
  width: number,
  height: number
): object {
  const baseWidth = el.size?.width?.magnitude || width;
  const baseHeight = el.size?.height?.magnitude || height;
  return {
    scaleX: width / baseWidth,
    scaleY: height / baseHeight,
    translateX: x,
    translateY: y,
    unit: "EMU",
  };
}

/**
 * Generate lyric slides from stored lyrics text — one slide per stanza
 * (stanzas are separated by blank lines). When English lyrics are present,
 * each slide shows the Chinese stanza with the matching English stanza below
 * it (extra English stanzas are dropped).
 *
 * Slides are produced by DUPLICATING the hymn's own title slide and replacing
 * its text, so they inherit the deck's layout, master background (which is a
 * stretched picture on the master — never readable from the slide's own
 * pageBackgroundFill), the translucent card, font and color. The card and text
 * box are then resized to the full-page lyrics geometry used by the hymn bank.
 * Returns the number of slides inserted.
 */
async function createLyricsSlides(
  slidesClient: ReturnType<typeof getSlidesClient>,
  targetPresentationId: string,
  insertIndex: number,
  lyricsZh: string,
  lyricsEn: string | undefined,
  titleSlide: slides_v1.Schema$Page | undefined,
  pageWidth: number,
  pageHeight: number
): Promise<number> {
  const splitStanzas = (text: string) =>
    text
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const stanzasZh = splitStanzas(lyricsZh);
  if (stanzasZh.length === 0) return 0;
  const stanzasEn = lyricsEn ? splitStanzas(lyricsEn) : [];

  const cardX = LYRICS_MARGIN_X_EMU;
  const cardY = LYRICS_MARGIN_Y_EMU;
  const cardWidth = pageWidth - 2 * LYRICS_MARGIN_X_EMU;
  const cardHeight = pageHeight - 2 * LYRICS_MARGIN_Y_EMU;

  const slideText = (i: number) => {
    const en = stanzasEn[i];
    return en ? `${stanzasZh[i]}\n\n${en}` : stanzasZh[i];
  };

  // Pick one type size for the whole hymn — the largest on the ladder at which
  // every stanza still fits the card — so stanzas don't change size mid-hymn.
  const availableHeight = cardHeight - LYRICS_TEXT_PADDING_EMU;
  const lineCounts = stanzasZh.map((zh, i) => {
    const en = stanzasEn[i];
    return {
      // The blank separator line is styled at the Chinese size
      zhLines: zh.split("\n").length + (en ? 1 : 0),
      enLines: en ? en.split("\n").length : 0,
    };
  });
  const [zhSize, enSize] =
    LYRICS_SIZE_LADDER.find(([zhPt, enPt]) =>
      lineCounts.every(
        ({ zhLines, enLines }) =>
          (zhLines * zhPt + enLines * enPt) *
            LINE_HEIGHT_FACTOR *
            (LYRICS_LINE_SPACING / 100) *
            PT_TO_EMU <=
          availableHeight
      )
    ) ?? LYRICS_SIZE_LADDER[LYRICS_SIZE_LADDER.length - 1];

  /** Text of one lyric slide. */
  const stanzaContent = (i: number) => ({
    zh: stanzasZh[i],
    en: stanzasEn[i],
    text: slideText(i),
  });

  const requests: object[] = [];
  const donor = findLyricsDonor(titleSlide);

  if (donor) {
    // Each duplicate lands directly after the title slide, so emitting the
    // stanzas in reverse leaves them in reading order: title, 1, 2, … n.
    for (let i = stanzasZh.length - 1; i >= 0; i--) {
      const { zh, en, text } = stanzaContent(i);
      const slideId = `hymn_lyr_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
      const cardId = `${slideId}_card`;
      const textBoxId = `${slideId}_txt`;

      const objectIds: Record<string, string> = {
        [donor.slideId]: slideId,
        [donor.textBox.objectId!]: textBoxId,
      };
      if (donor.card?.objectId) objectIds[donor.card.objectId] = cardId;
      donor.dropIds.forEach((id, n) => {
        objectIds[id] = `${slideId}_d${n}`;
      });

      requests.push({ duplicateObject: { objectId: donor.slideId, objectIds } });

      // Lyric slides carry no "颂诗 HYMN" header (matching the hymn bank)
      donor.dropIds.forEach((_, n) => {
        requests.push({ deleteObject: { objectId: `${slideId}_d${n}` } });
      });

      // Grow the title-sized card and text box to the full-page lyrics geometry
      if (donor.card?.objectId) {
        requests.push({
          updatePageElementTransform: {
            objectId: cardId,
            applyMode: "ABSOLUTE",
            transform: absoluteTransform(donor.card, cardX, cardY, cardWidth, cardHeight),
          },
        });
      }
      requests.push({
        updatePageElementTransform: {
          objectId: textBoxId,
          applyMode: "ABSOLUTE",
          transform: absoluteTransform(donor.textBox, cardX, cardY, cardWidth, cardHeight),
        },
      });

      requests.push({ deleteText: { objectId: textBoxId, textRange: { type: "ALL" } } });
      requests.push({ insertText: { objectId: textBoxId, insertionIndex: 0, text } });
      requests.push({
        updateShapeProperties: {
          objectId: textBoxId,
          shapeProperties: { contentAlignment: "MIDDLE" },
          fields: "contentAlignment",
        },
      });
      requests.push({
        updateParagraphStyle: {
          objectId: textBoxId,
          style: { alignment: "CENTER", lineSpacing: LYRICS_LINE_SPACING },
          textRange: { type: "ALL" },
          fields: "alignment,lineSpacing",
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: textBoxId,
          style: { ...donor.runStyle, fontSize: { magnitude: zhSize, unit: "PT" }, bold: false },
          textRange: { type: "ALL" },
          fields: [...Object.keys(donor.runStyle), "fontSize", "bold"].join(","),
        },
      });
      if (en) {
        const enStart = zh.length + 2; // after the Chinese stanza + blank line
        requests.push({
          updateTextStyle: {
            objectId: textBoxId,
            style: { fontSize: { magnitude: enSize, unit: "PT" } },
            textRange: { type: "FIXED_RANGE", startIndex: enStart, endIndex: enStart + en.length },
            fields: "fontSize",
          },
        });
      }
    }
  } else {
    // Unrecognised template: build the slide on the title slide's own layout so
    // it still inherits the master background, and leave the page background
    // and text color to the theme rather than forcing a color pair.
    const layoutId = titleSlide?.slideProperties?.layoutObjectId;
    stanzasZh.forEach((_, i) => {
      const { zh, en, text } = stanzaContent(i);
      const slideId = `hymn_lyr_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
      const textBoxId = `${slideId}_txt`;

      requests.push({
        createSlide: {
          objectId: slideId,
          insertionIndex: insertIndex + i,
          slideLayoutReference: layoutId ? { layoutId } : { predefinedLayout: "BLANK" },
        },
      });
      requests.push({
        createShape: {
          objectId: textBoxId,
          shapeType: "TEXT_BOX",
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: cardWidth, unit: "EMU" },
              height: { magnitude: cardHeight, unit: "EMU" },
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: cardX,
              translateY: cardY,
              unit: "EMU",
            },
          },
        },
      });
      requests.push({ insertText: { objectId: textBoxId, insertionIndex: 0, text } });
      requests.push({
        updateShapeProperties: {
          objectId: textBoxId,
          shapeProperties: { contentAlignment: "MIDDLE" },
          fields: "contentAlignment",
        },
      });
      requests.push({
        updateParagraphStyle: {
          objectId: textBoxId,
          style: { alignment: "CENTER", lineSpacing: LYRICS_LINE_SPACING },
          textRange: { type: "ALL" },
          fields: "alignment,lineSpacing",
        },
      });
      requests.push({
        updateTextStyle: {
          objectId: textBoxId,
          style: { fontSize: { magnitude: zhSize, unit: "PT" }, bold: false },
          textRange: { type: "ALL" },
          fields: "fontSize,bold",
        },
      });
      if (en) {
        const enStart = zh.length + 2;
        requests.push({
          updateTextStyle: {
            objectId: textBoxId,
            style: { fontSize: { magnitude: enSize, unit: "PT" } },
            textRange: { type: "FIXED_RANGE", startIndex: enStart, endIndex: enStart + en.length },
            fields: "fontSize",
          },
        });
      }
    });
  }

  await slidesClient.presentations.batchUpdate({
    presentationId: targetPresentationId,
    requestBody: { requests },
  });
  return stanzasZh.length;
}

// ── Schedule sheet role lookup ────────────────────────────────────────────────

/** Return a YYYY-M-D key using LOCAL date components for timezone-safe comparison. */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * Parse a date value from a Google Sheets cell into a LOCAL-time Date.
 * Handles: serial numbers, M/D, M/D/YYYY, YYYY/M/D, YYYY-MM-DD, YYYY年M月D日, M月D日.
 * @param fallbackYear  Used for partial dates (M/D only, no year).
 */
function parseSheetDate(cell: unknown, fallbackYear: number): Date | null {
  if (cell === null || cell === undefined || cell === "") return null;

  // Numeric → Google Sheets serial (days since 1899-12-30 UTC)
  const maybeNum = Number(cell);
  if (!isNaN(maybeNum) && typeof cell !== "boolean" && String(cell).trim() !== "") {
    const tmp = new Date(Date.UTC(1899, 11, 30) + maybeNum * 86400000);
    return new Date(tmp.getUTCFullYear(), tmp.getUTCMonth(), tmp.getUTCDate());
  }

  const str = String(cell).trim();
  if (!str) return null;

  // M/D or M/D/YYYY  (e.g. "3/23" or "3/23/2026")
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
  if (mdy) {
    const year = mdy[3] ? parseInt(mdy[3], 10) : fallbackYear;
    return new Date(year, parseInt(mdy[1], 10) - 1, parseInt(mdy[2], 10));
  }

  // YYYY/M/D
  const ymd = str.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymd) {
    return new Date(parseInt(ymd[1], 10), parseInt(ymd[2], 10) - 1, parseInt(ymd[3], 10));
  }

  // YYYY-MM-DD (ISO) — parse as local to avoid UTC-offset confusion
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(parseInt(iso[1], 10), parseInt(iso[2], 10) - 1, parseInt(iso[3], 10));
  }

  // YYYY年M月D日
  const cn = str.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (cn) {
    return new Date(parseInt(cn[1], 10), parseInt(cn[2], 10) - 1, parseInt(cn[3], 10));
  }

  // M月D日 (no year)
  const cnMd = str.match(/^(\d{1,2})月(\d{1,2})日?/);
  if (cnMd) {
    return new Date(fallbackYear, parseInt(cnMd[1], 10) - 1, parseInt(cnMd[2], 10));
  }

  return null;
}

/**
 * Fetch service roles for two consecutive Sundays from the schedule spreadsheet.
 *
 * Sheet layout (transposed — rows = Sundays, columns = roles):
 *   Row 1:     A=ignored, B=role1, C=role2, D=大堂信息, E=role4, …
 *   Row 2+:    A=date,    B=name,  C=name,  D=speaker,  E=name,  …
 *
 * Returns maps keyed by role/column header name, e.g. { "领会": "张三", "大堂信息": "李牧师", … }
 * Non-fatal: logs warnings and returns empty maps on any failure.
 */
export async function fetchServiceRoles(
  scheduleSheetId: string,
  thisSunday: Date,
  nextSunday: Date
): Promise<{ thisWeek: Record<string, string>; nextWeek: Record<string, string> }> {
  const empty = { thisWeek: {}, nextWeek: {} };
  try {
    const sheets = getSheetsClient();
    const year = thisSunday.getFullYear();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: scheduleSheetId,
      range: `${year}!A1:ZZ200`,
      valueRenderOption: "FORMATTED_VALUE",
    });

    const rows: string[][] = (res.data.values || []).map((r) =>
      (r as unknown[]).map(String)
    );
    if (rows.length < 2) {
      console.warn("fetchServiceRoles: sheet has fewer than 2 rows");
      return empty;
    }

    // Row 0 = column headers (role names starting from col B/index 1)
    // Column A (index 0) in rows 1+ = Sunday dates
    const headerRow = rows[0];
    const thisKey = dateKey(thisSunday);
    const nextKey = dateKey(nextSunday);

    console.log("fetchServiceRoles: headers =", headerRow.slice(0, 8));
    console.log("fetchServiceRoles: looking for", thisKey, "and", nextKey);

    let thisRowIdx = -1;
    let nextRowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
      const d = parseSheetDate(rows[i][0], year);
      if (!d) continue;
      const k = dateKey(d);
      if (k === thisKey) thisRowIdx = i;
      if (k === nextKey) nextRowIdx = i;
    }

    if (thisRowIdx === -1) {
      console.warn(`fetchServiceRoles: row for ${thisKey} not found`);
    }
    if (nextRowIdx === -1) {
      console.warn(`fetchServiceRoles: row for ${nextKey} not found`);
    }

    const thisWeek: Record<string, string> = {};
    const nextWeek: Record<string, string> = {};

    for (let col = 1; col < headerRow.length; col++) {
      // Normalize: take first line only (before \n), strip all spaces
      const roleName = (headerRow[col] || "").split("\n")[0].replace(/ /g, "").trim();
      if (!roleName) continue;
      if (thisRowIdx !== -1) thisWeek[roleName] = rows[thisRowIdx]?.[col] || "";
      if (nextRowIdx !== -1) nextWeek[roleName] = rows[nextRowIdx]?.[col] || "";
    }

    console.log("fetchServiceRoles: thisWeek =", thisWeek);
    return { thisWeek, nextWeek };
  } catch (err) {
    console.warn("fetchServiceRoles: failed to fetch schedule sheet", err);
    return empty;
  }
}

// ── Per-slide verse content replacement ──────────────────────────────────────

/**
 * Paginate verse strings into pages ≤ limit chars each.
 * Matches Apps Script findOneVerse() logic: title appears only on the LAST page;
 * intermediate pages get an empty [vetitle].
 */
function paginateVerses(
  verses: string[],
  title: string,
  limit = 240
): { pages: string[]; pageTitles: string[] } {
  const pages: string[] = [];
  const pageTitles: string[] = [];
  let current = "";
  for (const verse of verses) {
    const next = current ? current + " " + verse : verse;
    if (next.length > limit && current) {
      pages.push(current);
      pageTitles.push(""); // intermediate page: no title
      current = verse;
    } else {
      current = next;
    }
  }
  pages.push(current);
  pageTitles.push(title); // last page: show title
  return { pages, pageTitles };
}

/** One scripture section of the deck. */
export interface VerseEntry {
  /** Text that identifies the template slide, e.g. "宣召". */
  keyword: string;
  /** A Bible reference, or literal text when `literal` is set. */
  verse: string;
  vetitle: string;
  /** Keep all segments on a single slide (金句). */
  noSplit?: boolean;
  /** `verse` is free-form text to print verbatim, not a reference to look up. */
  literal?: boolean;
}

/**
 * For each entry, find slides whose text contains `keyword`, replace [vetitle]
 * and [verse] on those slides. If the verse text exceeds 240 chars, the template
 * slide is duplicated and content is split across pages — matching the Apps Script
 * findOneVerse() pagination logic (title on last page only).
 *
 * References are resolved through `lib/bible-reference.ts` — the same parser the
 * Bible tool and the PPT preview use, so what the operator confirmed in the
 * preview is exactly what lands on the slides. Callers are expected to have
 * validated the references first (see the generate-slides route); an invalid
 * reference here throws rather than printing the raw reference as scripture.
 */
export async function replaceVerseContent(
  presentationId: string,
  entries: VerseEntry[],
  bibleSheetId?: string,
  isJoint = false
): Promise<void> {
  if (entries.length === 0) return;

  const slidesClient = getSlidesClient();
  const pres = await slidesClient.presentations.get({ presentationId });
  const allSlides = pres.data.slides || [];

  const bibleIndex = bibleSheetId ? await loadBibleIndex(bibleSheetId) : null;

  // ── Phase 1: resolve content and paginate for each entry ─────────────────
  interface EntryPlan {
    templatePageId: string;
    // [verse] / [vetitle]: combined zh+en when joint service, Chinese-only otherwise
    versePages: string[];
    verseTitles: string[];
    // [cnve] / [cnvetitle]: Chinese only
    cnPages: string[];
    cnTitles: string[];
    // [enve] / [envetitle]: English only
    enPages: string[];
    enTitles: string[];
  }
  const plans: EntryPlan[] = [];

  for (const entry of entries) {
    const matchedPageIds: string[] = [];
    // Strip whitespace before matching to handle templates where keywords are
    // split across text runs or have inter-character spaces (e.g. "宣 告 赦 免").
    const keywordNorm = entry.keyword.replace(/\s+/g, "");
    for (const slide of allSlides) {
      const text = (slide.pageElements || [])
        .map((el) =>
          (el.shape?.text?.textElements || [])
            .map((te) => te.textRun?.content || "")
            .join("")
        )
        .join(" ")
        .replace(/\s+/g, "");
      if (text.includes(keywordNorm)) matchedPageIds.push(slide.objectId!);
    }
    if (matchedPageIds.length === 0) {
      console.warn(`replaceVerseContent: no slide found for keyword "${entry.keyword}" (normalized: "${keywordNorm}")`);
      // Log all slide texts to help diagnose the mismatch
      allSlides.forEach((s, i) => {
        const raw = (s.pageElements || [])
          .map((el) => (el.shape?.text?.textElements || []).map((te) => te.textRun?.content || "").join(""))
          .join(" ");
        if (raw.trim()) console.warn(`  slide ${i + 1} [${s.objectId}]: raw="${raw.slice(0, 120)}"`);
      });
      continue;
    }

    // Fetch Bible text; one segment per comma-separated range. Literal entries
    // (宣召自定义文字) and empty fields are printed as-is without a lookup.
    const verseSegments =
      bibleIndex && bibleSheetId && entry.verse && !entry.literal
        ? await fetchSegments(
            bibleSheetId,
            bibleIndex,
            resolveRef(entry.verse, bibleIndex.books, bibleIndex.bounds)
          )
        : null;

    let cnPages: string[];
    let cnTitles: string[];
    let enPages: string[];
    let enTitles: string[];

    if (entry.noSplit) {
      // 金句: join everything onto one slide regardless of segment count
      const allZh = verseSegments ? verseSegments.flatMap((s) => s.zhVerses) : [entry.verse];
      const allEn = verseSegments ? verseSegments.flatMap((s) => s.enVerses) : [entry.verse];
      const zhT   = verseSegments ? verseSegments.map((s) => s.zhTitle).join("; ") : entry.vetitle;
      const enT   = verseSegments ? verseSegments.map((s) => s.enTitle).join("; ") : entry.vetitle;
      cnPages = [allZh.join(" ")]; cnTitles = [zhT];
      enPages = [allEn.join(" ")]; enTitles = [enT];
    } else if (verseSegments) {
      // Paginate each range segment separately so each starts on its own slide
      cnPages = []; cnTitles = []; enPages = []; enTitles = [];
      for (const seg of verseSegments) {
        const zh = paginateVerses(seg.zhVerses, seg.zhTitle, 240);
        cnPages.push(...zh.pages); cnTitles.push(...zh.pageTitles);
        const en = paginateVerses(seg.enVerses, seg.enTitle, 630);
        enPages.push(...en.pages); enTitles.push(...en.pageTitles);
      }
    } else {
      // Literal text, an empty field, or no Bible sheet configured — print as-is.
      cnPages = [entry.verse]; cnTitles = [entry.vetitle];
      enPages = [entry.verse]; enTitles = [entry.vetitle];
    }

    // [verse]/[vetitle]: all Chinese pages first, then all English pages for joint service.
    // noSplit entries (e.g. 金句) always stay on a single slide — cn and en on the same page.
    let versePages: string[];
    let verseTitles: string[];
    let cnPagesForPlan: string[];
    let cnTitlesForPlan: string[];
    let enPagesForPlan: string[];
    let enTitlesForPlan: string[];
    if (isJoint && !entry.noSplit) {
      const cnLen = cnPages.length;
      const enLen = enPages.length;
      versePages  = [...cnPages,  ...enPages];
      verseTitles = [...cnTitles, ...enTitles];
      // On Chinese slides: show Chinese in [cnve], empty in [enve]
      // On English slides: empty in [cnve], English in [enve]
      cnPagesForPlan  = [...cnPages,               ...Array(enLen).fill("")];
      cnTitlesForPlan = [...cnTitles,              ...Array(enLen).fill("")];
      enPagesForPlan  = [...Array(cnLen).fill(""), ...enPages];
      enTitlesForPlan = [...Array(cnLen).fill(""), ...enTitles];
    } else {
      versePages      = cnPages;
      verseTitles     = cnTitles;
      cnPagesForPlan  = cnPages;
      cnTitlesForPlan = cnTitles;
      enPagesForPlan  = enPages;
      enTitlesForPlan = enTitles;
    }

    plans.push({
      templatePageId: matchedPageIds[0],
      versePages, verseTitles,
      cnPages: cnPagesForPlan, cnTitles: cnTitlesForPlan,
      enPages: enPagesForPlan, enTitles: enTitlesForPlan,
    });
  }

  if (plans.length === 0) return;

  // ── Phase 2: duplicate slides for multi-page entries ─────────────────────
  // Use the largest page count across all content types to determine slide count.
  const planPageCounts = plans.map((p) =>
    Math.max(p.versePages.length, p.cnPages.length, p.enPages.length)
  );

  const dupeRequests = plans.flatMap((plan, pi) =>
    Array.from({ length: planPageCounts[pi] - 1 }, () => ({
      duplicateObject: { objectId: plan.templatePageId },
    }))
  );

  // pageIds[i] = [templateId, newId1, newId2, ...] for plans[i]
  const pageIds: string[][] = plans.map((p) => [p.templatePageId]);

  if (dupeRequests.length > 0) {
    const dupeRes = await slidesClient.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: dupeRequests },
    });
    const replies = dupeRes.data.replies || [];
    let ri = 0;
    for (let pi = 0; pi < plans.length; pi++) {
      const newIds: string[] = [];
      for (let i = 1; i < planPageCounts[pi]; i++) {
        const newId = (replies[ri++] as { duplicateObject?: { objectId?: string } })
          ?.duplicateObject?.objectId;
        if (newId) newIds.push(newId);
      }
      // Each duplicateObject inserts the copy RIGHT AFTER the template, pushing
      // previous copies down. So reply order [D1, D2] → deck order [T, D2, D1].
      // Reverse the collected IDs so pageIds[pi] matches the actual slide order.
      pageIds[pi].push(...newIds.reverse());
    }
  }

  // ── Phase 3: fill verse/title placeholders on each page ──────────────────
  const fillRequests: object[] = [];
  for (let pi = 0; pi < plans.length; pi++) {
    const { versePages, verseTitles, cnPages, cnTitles, enPages, enTitles } = plans[pi];
    const totalSlides = planPageCounts[pi];
    for (let i = 0; i < totalSlides; i++) {
      const pageId = pageIds[pi][i];
      if (!pageId) continue;

      for (const [placeholder, value] of [
        ["[verse]",      versePages[i]  ?? ""],
        ["[vetitle]",    verseTitles[i] ?? ""],
        ["[cnve]",       cnPages[i]     ?? ""],
        ["[cnvetitle]",  cnTitles[i]    ?? ""],
        ["[enve]",       enPages[i]     ?? ""],
        ["[envetitle]",  enTitles[i]    ?? ""],
      ] as [string, string][]) {
        fillRequests.push({
          replaceAllText: {
            containsText: { text: placeholder, matchCase: true },
            replaceText: value,
            pageObjectIds: [pageId],
          },
        });
      }
    }
  }

  if (fillRequests.length === 0) return;
  await slidesClient.presentations.batchUpdate({
    presentationId,
    requestBody: { requests: fillRequests },
  });
}

// ── Presentation URL helper ───────────────────────────────────────────────────

export function buildPresentationUrl(presentationId: string): string {
  return `https://docs.google.com/presentation/d/${presentationId}/edit`;
}
