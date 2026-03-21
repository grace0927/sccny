/**
 * Run this script once to discover all {CELL_REF} placeholders in the Google Slides template
 * and match them to the Google Sheet summary tab cells.
 *
 * Usage:
 *   1. Make sure GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is set in .env.local
 *   2. From apps/sccny/:
 *      node --env-file=.env.local scripts/discover-placeholders.mjs
 */

import { google } from "googleapis";

const TEMPLATE_ID = process.env.GOOGLE_SLIDES_TEMPLATE_ID;
const BIBLE_SHEET_ID = process.env.GOOGLE_BIBLE_SHEET_ID;

if (!TEMPLATE_ID) {
  console.error("GOOGLE_SLIDES_TEMPLATE_ID is not set");
  process.exit(1);
}

const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
  : null;

if (!credentials) {
  console.error("GOOGLE_SERVICE_ACCOUNT_CREDENTIALS is not set");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/presentations.readonly",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
  ],
});

const slidesClient = google.slides({ version: "v1", auth });
const sheetsClient = google.sheets({ version: "v4", auth });

// ── Step 1: extract all {CELL_REF} patterns from the template ────────────────

console.log("\n=== Template Placeholders ===\n");

const pres = await slidesClient.presentations.get({ presentationId: TEMPLATE_ID });
const placeholders = new Set();

for (const slide of pres.data.slides ?? []) {
  for (const el of slide.pageElements ?? []) {
    const textElements = el.shape?.text?.textElements ?? [];
    for (const te of textElements) {
      const content = te.textRun?.content ?? "";
      const matches = content.match(/\{[^}]+\}/g);
      if (matches) matches.forEach((m) => placeholders.add(m));
    }
  }
}

const sortedPlaceholders = [...placeholders].sort();
console.log("Found placeholders:", sortedPlaceholders);

// ── Step 2: read summary tab to map cell refs to content ─────────────────────

if (BIBLE_SHEET_ID) {
  console.log("\n=== Summary Tab (rows 1–50) ===\n");
  try {
    const summaryRes = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: BIBLE_SHEET_ID,
      range: "summary!A1:I50",
    });
    const rows = summaryRes.data.values ?? [];
    rows.forEach((row, i) => {
      const rowNum = i + 1;
      row.forEach((cell, j) => {
        if (cell) {
          const colLetter = String.fromCharCode(65 + j); // A, B, C...
          console.log(`  {${colLetter}${rowNum}} = "${cell}"`);
        }
      });
    });
  } catch (e) {
    console.warn("Could not read summary tab:", e.message);
  }
}

// ── Step 3: print the PLACEHOLDER_MAP to paste into the route ────────────────

console.log("\n=== Paste this into generate-slides/route.ts ===\n");
console.log("const PLACEHOLDER_MAP: Record<string, string> = {");
for (const p of sortedPlaceholders) {
  console.log(`  '${p}': '', // TODO: map to form field`);
}
console.log("};");
