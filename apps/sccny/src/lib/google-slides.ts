import "server-only";
import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";

// ── Auth ──────────────────────────────────────────────────────────────────────

function getGoogleAuth() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsJson && !credentialsPath) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not configured");
  }

  const credentials = credentialsJson
    ? JSON.parse(credentialsJson)
    : JSON.parse(fs.readFileSync(credentialsPath!, "utf-8"));

  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/presentations",
      "https://www.googleapis.com/auth/spreadsheets.readonly",
    ],
  });
}

function getSlidesClient() {
  return google.slides({ version: "v1", auth: getGoogleAuth() });
}

function getDriveClient() {
  return google.drive({ version: "v3", auth: getGoogleAuth() });
}

function getSheetsClient() {
  return google.sheets({ version: "v4", auth: getGoogleAuth() });
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

// ── Hymn slide copy ───────────────────────────────────────────────────────────

/** Extract slide text for hymn-title matching. */
function slideFullText(slide: { pageElements?: Array<{ shape?: { text?: { textElements?: Array<{ textRun?: { content?: string | null } | null }> | null } | null } | null }> | null }): string {
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
  bankSlides: Array<{ objectId?: string | null; pageElements?: unknown[] | null }>,
  hymnTitle: string
): string[] {
  const matchedIds: string[] = [];
  let inHymn = false;

  for (const slide of bankSlides) {
    const pageId = slide.objectId!;
    const fullText = slideFullText(slide as Parameters<typeof slideFullText>[0]);

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

/**
 * Copy hymn LYRICS slides from the hymn bank into the target presentation,
 * inserting them immediately after the corresponding hymn title slide
 * (identified by containing both the hymn title and "颂诗 HYMN").
 * The first slide in the bank for each hymn (the title slide) is skipped.
 */
export async function copyHymnSlides(
  targetPresentationId: string,
  hymnBankId: string,
  hymnTitles: string[],
): Promise<string[]> {
  const missingHymns: string[] = [];
  if (hymnTitles.length === 0) return missingHymns;

  const slides = getSlidesClient();

  // Fetch hymn bank and a snapshot of the target presentation (for locating title slides)
  const [hymnBank, targetPres] = await Promise.all([
    slides.presentations.get({ presentationId: hymnBankId }),
    slides.presentations.get({ presentationId: targetPresentationId }),
  ]);
  const bankSlides = hymnBank.data.slides || [];
  const targetSlides = targetPres.data.slides || [];

  let insertionOffset = 0; // tracks extra slides inserted so far

  for (const title of hymnTitles) {
    const allPageIds = findHymnPageIds(bankSlides, title);
    if (allPageIds.length === 0) {
      console.warn(`copyHymnSlides: no slides found for hymn "${title}"`);
      missingHymns.push(title);
      continue;
    }

    // Skip the first slide (title slide in the bank); only copy lyrics
    const pageIds = allPageIds.slice(1);
    if (pageIds.length === 0) {
      console.warn(`copyHymnSlides: only a title slide found for hymn "${title}", no lyrics`);
      missingHymns.push(title);
      continue;
    }

    // Find the hymn title slide in the target presentation:
    // must contain both the hymn title AND "颂诗 HYMN"
    let titleSlideIndex = -1;
    for (let i = 0; i < targetSlides.length; i++) {
      const text = slideFullText(targetSlides[i] as Parameters<typeof slideFullText>[0]);
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

    // Insert lyrics slides right after the title slide
    let currentIndex = titleSlideIndex + 1 + insertionOffset;

    for (const pageId of pageIds) {
      const src = bankSlides.find((s) => s.objectId === pageId);
      if (!src) continue;

      const newSlideId = `hymn_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const requests: object[] = [];

      // 1. Create blank slide
      requests.push({
        createSlide: {
          objectId: newSlideId,
          insertionIndex: currentIndex,
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

      // Execute all requests for this slide in one batch
      await slides.presentations.batchUpdate({
        presentationId: targetPresentationId,
        requestBody: { requests },
      });

      currentIndex++;
      insertionOffset++;
    }
  }
  return missingHymns;
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
 * Common Chinese Bible book abbreviations → canonical full names.
 * Sorted longest-first at build time so shorter prefixes don't shadow longer ones.
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
// Pre-sort entries longest-first to prevent short prefixes shadowing longer ones.
const ABBREV_ENTRIES = Object.entries(BOOK_ABBREV_MAP).sort((a, b) => b[0].length - a[0].length);

/**
 * Expand a common abbreviation at the start of a verse reference, e.g. "林前1:18" → "哥林多前书1:18".
 * Only expands when the character after the abbreviation is a digit, 第, space, or colon —
 * so full names like "以弗所书" are never corrupted.
 */
function expandBookAbbreviation(ref: string): string {
  for (const [abbrev, full] of ABBREV_ENTRIES) {
    if (!ref.startsWith(abbrev)) continue;
    const after = ref.slice(abbrev.length);
    if (after === "" || /^[\d第\s：:]/.test(after)) return full + after;
  }
  return ref;
}

/**
 * Normalise Chinese chapter ordinals ("第五章") to Arabic digits ("5").
 * e.g. "哥林多前书第五章" → "哥林多前书5"
 */
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

/** Return last index i where arr[i] <= target; -1 if none. */
function binarySearchLE(arr: number[], target: number): number {
  let lo = 0, hi = arr.length - 1, result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= target) { result = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return result;
}

/**
 * Parse a Chinese verse reference into its components.
 * Handles: "约翰一书1:9", "诗篇51", "罗马书8：1-2", "哥林多前书第七章1-40".
 * bookNamesList must be sorted by zhName.length descending (longest first).
 */
function parseVerseRef(
  ref: string,
  bookNamesList: Array<{ zhName: string; enName: string; bookNum: number }>
): { bookNum: number; bookZh: string; bookEn: string; chapter: number; startVerse: number; endVerse: number; verseSpecified: boolean } | null {
  const normalized = normalizeChapterRef(expandBookAbbreviation(ref.trim()));
  for (const { zhName, enName, bookNum } of bookNamesList) {
    if (!normalized.startsWith(zhName)) continue;
    // trimStart handles "以弗所书 1:7-8" where a space separates book and chapter
    const rest = normalized.slice(zhName.length).trimStart();
    // chapter[章][: or ：][startVerse][- or ~][endVerse]
    const m = rest.match(/^(\d+)章?(?:[：:](\d+)(?:[-~](\d+))?)?/);
    if (!m) continue;
    const chapter    = parseInt(m[1], 10);
    const startVerse = m[2] ? parseInt(m[2], 10) : 1;
    const endVerse   = m[3] ? parseInt(m[3], 10) : startVerse;
    return { bookNum, bookZh: zhName, bookEn: enName, chapter, startVerse, endVerse, verseSpecified: !!m[2] };
  }
  return null;
}

/**
 * Look up Chinese Bible verse text + formatted title.
 *
 * Uses bibleData col A keys (bookNum*1e6 + chapter*1e3 + verse, sorted) for fast
 * lookup — matches the Apps Script MATCH formula and findOneVerse() output format:
 *   text:  "{n} {verseText}" per verse, space-joined
 *   title: "bookZh chapter:start~end"
 *
 * @param bookNamesList  Pre-fetched from bookNames!A:C, sorted longest-name first.
 * @param bibleDataKeys  Pre-fetched from bibleData!A:A (all ~31K verse keys).
 */
/** Fetch verse text for a single, already-resolved ref segment (no commas). */
async function fetchSingleRef(
  bibleSheetId: string,
  ref: string,
  bookNamesList: Array<{ zhName: string; enName: string; bookNum: number }>,
  bibleDataKeys: number[]
): Promise<{ zhVerses: string[]; enVerses: string[]; zhTitle: string; enTitle: string } | null> {
  const parsed = parseVerseRef(ref, bookNamesList);
  if (!parsed) {
    console.warn("fetchVerseText: could not parse ref:", ref);
    return null;
  }

  const { bookNum, bookZh, bookEn, chapter, startVerse, endVerse, verseSpecified } = parsed;
  const startKey = bookNum * 1000000 + chapter * 1000 + startVerse;
  const startIdx = binarySearchLE(bibleDataKeys, startKey);

  if (startIdx < 0 || bibleDataKeys[startIdx] !== startKey) {
    console.warn("fetchVerseText: verse not found for key", startKey, "ref:", ref);
    return null;
  }

  const endKey = verseSpecified
    ? bookNum * 1000000 + chapter * 1000 + endVerse
    : bookNum * 1000000 + chapter * 1000 + 999;
  const endIdx = Math.min(binarySearchLE(bibleDataKeys, endKey), bibleDataKeys.length - 1);

  const actualEndVerse = bibleDataKeys[endIdx] % 1000;
  const verseRange = actualEndVerse === startVerse ? `${startVerse}` : `${startVerse}-${actualEndVerse}`;
  const zhTitle = `${bookZh} ${chapter}:${verseRange}`;
  const enTitle = `${bookEn || bookZh} ${chapter}:${verseRange}`;

  try {
    const sheets = getSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: bibleSheetId,
      range: `bibleData!B${startIdx + 1}:C${endIdx + 1}`,
      valueRenderOption: "FORMATTED_VALUE",
    });
    const verseRows = (res.data.values || []) as string[][];
    const zhVerses = verseRows.map((r, i) => `${startVerse + i} ${(r[0] || "").trim()}`);
    const enVerses = verseRows.map((r, i) => `${startVerse + i} ${(r[1] || "").trim()}`);
    return {
      zhVerses: zhVerses.length > 0 ? zhVerses : [ref],
      enVerses: enVerses.length > 0 ? enVerses : [ref],
      zhTitle,
      enTitle,
    };
  } catch (err) {
    console.warn("fetchVerseText: fetch failed for ref", ref, err);
    return { zhVerses: [ref], enVerses: [ref], zhTitle, enTitle };
  }
}

async function fetchVerseText(
  bibleSheetId: string,
  ref: string,
  bookNamesList: Array<{ zhName: string; enName: string; bookNum: number }>,
  bibleDataKeys: number[]
): Promise<Array<{ zhVerses: string[]; enVerses: string[]; zhTitle: string; enTitle: string }> | null> {
  if (!ref || bookNamesList.length === 0 || bibleDataKeys.length === 0) return null;

  // Split multi-range refs like "林前1:18-25, 2:1-8, 3:18-20".
  // Segments that start with a digit re-use the book prefix from the previous segment.
  const rawParts = ref.split(/[,;]\s*/);
  const segments: string[] = [];
  let bookPrefix = "";
  for (const part of rawParts) {
    const t = part.trim();
    if (!t) continue;
    if (/^\d/.test(t) && bookPrefix) {
      segments.push(bookPrefix + t);
    } else {
      segments.push(t);
      // Capture the leading non-digit characters as the book prefix
      const m = t.match(/^([^\d]+)/);
      if (m) bookPrefix = m[1];
    }
  }

  if (segments.length === 0) return null;

  // Fetch all segments in parallel; each becomes its own paginated group
  const results = await Promise.all(
    segments.map((seg) => fetchSingleRef(bibleSheetId, seg, bookNamesList, bibleDataKeys))
  );
  const valid = results.filter((r): r is NonNullable<typeof r> => r !== null);
  return valid.length > 0 ? valid : null;
}

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

/**
 * For each entry, find slides whose text contains `keyword`, replace [vetitle]
 * and [verse] on those slides. If the verse text exceeds 240 chars, the template
 * slide is duplicated and content is split across pages — matching the Apps Script
 * findOneVerse() pagination logic (title on last page only).
 */
export async function replaceVerseContent(
  presentationId: string,
  entries: Array<{ keyword: string; verse: string; vetitle: string; noSplit?: boolean }>,
  bibleSheetId?: string,
  isJoint = false
): Promise<void> {
  if (entries.length === 0) return;

  const slidesClient = getSlidesClient();
  const pres = await slidesClient.presentations.get({ presentationId });
  const allSlides = pres.data.slides || [];

  // Pre-fetch bookNames + bibleData key column for Bible verse lookup
  let bookNamesList: Array<{ zhName: string; enName: string; bookNum: number }> = [];
  let bibleDataKeys: number[] = [];
  if (bibleSheetId) {
    try {
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
      bookNamesList = ((bnRes.data.values || []) as string[][])
        .filter((r) => r[0] && r[2] && r[0] !== "----" && !isNaN(parseInt(r[2], 10)))
        .map((r) => ({ zhName: r[0], enName: r[1] ?? "", bookNum: parseInt(r[2], 10) }))
        .sort((a, b) => b.zhName.length - a.zhName.length);
      bibleDataKeys = ((bdRes.data.values || []) as string[][])
        .map((r) => parseInt(r[0] || "0", 10))
        .filter((n) => n > 0);
      console.log(`replaceVerseContent: loaded ${bookNamesList.length} books, ${bibleDataKeys.length} verses`);
    } catch (err) {
      console.warn("replaceVerseContent: failed to pre-fetch Bible data", err);
    }
  }

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

    // Fetch Bible text; returns one result per comma-separated range segment
    const verseSegments = bibleSheetId && entry.verse
      ? await fetchVerseText(bibleSheetId, entry.verse, bookNamesList, bibleDataKeys)
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
      // Fallback: no Bible data, show reference text
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
