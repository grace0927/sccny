import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { parseWorshipOrder } from "@/lib/parse-worship-order";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

const PARSE_PROMPT = `You are a Chinese church worship order parser. Extract the following fields from the text below and return ONLY valid JSON (no markdown, no explanation).

Fields to extract:
- hymns: array of {number: string, title: string, raw: string} — all hymns including response hymns (诗歌/回应诗歌), in order; "raw" is number + space + title (e.g. "12 你真伟大")
- scriptureReading: string — 经文 scripture reading reference
- memoryVerse: string — 金句 memory verse reference
- sermonTitle: string — 证道题目, extracted from inside quotes if present
- sermonSubtitle: string — second quoted string on the sermon title line, or ""
- speaker: string — preacher name (usually ends in 牧师/传道/弟兄/姊妹), or ""
- callToWorship: string — 宣召 reference
- confessionPrayer: string — 认罪祷告 reference
- assuranceOfPardon: string — 宣告赦免 reference
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
