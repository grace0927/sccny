import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { parseWorshipOrder } from "@/lib/parse-worship-order";
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

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body = await request.json();
    const text: string = body?.text;
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    // Primary: LLM parsing via Gemini
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent(PARSE_PROMPT + text);
        const raw = result.response.text().trim();
        // Strip markdown fences if the model wraps the JSON
        const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
        const data = JSON.parse(jsonText);
        console.info(`[parse-worship-order] source: LLM (${GEMINI_MODEL})`);
        return NextResponse.json({ data, source: "llm" });
      } catch (llmError) {
        console.warn("[parse-worship-order] LLM failed, falling back to rule-based parser:", llmError);
      }
    }

    // Fallback: rule-based parser
    console.info("[parse-worship-order] source: rule-based parser");
    const data = parseWorshipOrder(text);
    return NextResponse.json({ data, source: "rule-based" });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("parse-worship-order error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
