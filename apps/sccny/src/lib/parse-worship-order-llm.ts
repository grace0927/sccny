import "server-only";
import { z } from "zod";
import { parseWorshipOrder, type WorshipOrderData } from "./parse-worship-order";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

const PARSE_PROMPT = `You are a Chinese church worship order parser. Extract the following fields from the text below and return ONLY valid JSON (no markdown, no explanation).

For all Bible references (scriptureReading, memoryVerse, callToWorship, confessionPrayer, assuranceOfPardon), normalize the output:
- Expand abbreviations to full simplified-Chinese book names (e.g. "林後" → "哥林多后书", "詩" → "诗篇", "林前" → "哥林多前书")
- Replace full-width punctuation with ASCII (e.g. "：" → ":", "，" → ", ", "；" → ";")
- Separate multiple ranges with ", " (ASCII comma-space)
- Use Arabic numerals for chapters and verses throughout

Fields to extract:
- hymns: array of {number: string, title: string, raw: string, isResponse: boolean, youtubeUrl?: string} — all hymns in order; "raw" is number + space + title (e.g. "12 你真伟大"); set isResponse=true for 回应诗歌/Response Hymn lines AND for any 诗歌 that appears after the 证道/Sermon line, false for all others; if a YouTube URL appears on the hymn line, set youtubeUrl to that URL and omit it from "raw"
- scriptureReading: string — scripture reading reference (经文 / 信息经文 / Sermon Verses / Scripture Reading), normalized (e.g. "哥林多前书15:19-22, 15:35-45")
- memoryVerse: string — memory verse reference (金句 / Verses of the Week), normalized (e.g. "箴言3:5-7")
- sermonTitle: string — sermon title (证道 / Sermon), extracted from inside quotes if present; if no quotes, take the title text before the speaker name
- sermonSubtitle: string — second quoted string on the sermon title line, or ""
- speaker: string — preacher name (usually ends in 牧师/传道/弟兄/姊妹 or appears after the sermon title), or ""
- callToWorship: string — call to worship reference (宣召 / Call to Worship), normalized (e.g. "诗篇111")
- confessionPrayer: string — confession prayer reference (认罪祷告 / 认罪 / Confession), normalized, or ""
- assuranceOfPardon: string — assurance of pardon reference (宣告赦免 / Absolution), normalized (e.g. "以弗所书1:7-8")
- hasCommunion: boolean — true if 圣餐 or 聖餐 appears anywhere in the text
- otherLines: string[] — lines that do not map to any of the above fields

For empty/missing fields use "" or [] as appropriate.

Worship order text:
`;

/**
 * Shape check for the model's JSON.
 *
 * The LLM path used to return `JSON.parse(...)` unvalidated, which was tolerable
 * while a human always reviewed the result in the wizard before generating. The
 * email-triggered path has no such human, so a malformed-but-valid-JSON response
 * would otherwise reach the Slides API. A parse failure here is treated like any
 * other LLM failure: fall back to the rule-based parser.
 */
const HymnEntrySchema = z.object({
  number: z.string(),
  title: z.string(),
  raw: z.string(),
  isResponse: z.boolean().optional(),
  youtubeUrl: z.string().optional(),
});

const WorshipOrderDataSchema = z.object({
  hymns: z.array(HymnEntrySchema),
  scriptureReading: z.string(),
  memoryVerse: z.string(),
  sermonTitle: z.string(),
  sermonSubtitle: z.string(),
  speaker: z.string(),
  callToWorship: z.string(),
  callToWorshipCustomText: z.string().optional(),
  confessionPrayer: z.string(),
  assuranceOfPardon: z.string(),
  hasCommunion: z.boolean(),
  otherLines: z.array(z.string()),
});

export interface ParseWorshipOrderResult {
  data: WorshipOrderData;
  source: "llm" | "rule-based";
}

/**
 * Parse raw worship-order text into structured slide data.
 *
 * Primary path is Gemini (it normalizes Chinese Bible-book abbreviations and
 * full-width punctuation, which the rule-based parser does not). Falls back to
 * `parseWorshipOrder` when there is no API key, the call fails, the response
 * isn't JSON, or the JSON doesn't match the expected shape.
 */
export async function parseWorshipOrderSmart(
  text: string
): Promise<ParseWorshipOrderResult> {
  if (GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(PARSE_PROMPT + text);
      const raw = result.response.text().trim();
      // Strip markdown fences if the model wraps the JSON
      const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const data = WorshipOrderDataSchema.parse(JSON.parse(jsonText));
      console.info(`[parse-worship-order] source: LLM (${GEMINI_MODEL})`);
      return { data, source: "llm" };
    } catch (llmError) {
      console.warn(
        "[parse-worship-order] LLM failed, falling back to rule-based parser:",
        llmError
      );
    }
  }

  console.info("[parse-worship-order] source: rule-based parser");
  return { data: parseWorshipOrder(text), source: "rule-based" };
}
