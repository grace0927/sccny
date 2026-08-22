import { describe, it, expect } from "vitest";
import type { gmail_v1 } from "googleapis";
import { decodeBase64Url, extractPlainTextBody, getHeader } from "./gmail-message";

/** Encode as Gmail does: base64url, no padding. */
function b64url(text: string): string {
  return Buffer.from(text, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

type Part = gmail_v1.Schema$MessagePart;

describe("decodeBase64Url", () => {
  it("decodes plain ASCII", () => {
    expect(decodeBase64Url(b64url("hello"))).toBe("hello");
  });

  it("decodes multi-byte Chinese, which every worship order contains", () => {
    const text = "宣召：诗篇111\n证道：「你真伟大」";
    expect(decodeBase64Url(b64url(text))).toBe(text);
  });

  it("decodes payloads using the URL-safe alphabet", () => {
    // "??>?" round-trips through bytes that encode to '+' and '/' in standard
    // base64, so a decoder that skips the URL-safe translation gets this wrong.
    const text = "ûÿþ";
    const encoded = b64url(text);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBase64Url(encoded)).toBe(text);
  });
});

describe("extractPlainTextBody", () => {
  it("reads a single-part text/plain message", () => {
    const payload: Part = {
      mimeType: "text/plain",
      body: { data: b64url("宣召：诗篇111") },
    };
    expect(extractPlainTextBody(payload)).toBe("宣召：诗篇111");
  });

  it("prefers text/plain inside multipart/alternative", () => {
    const payload: Part = {
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: b64url("plain body") } },
        { mimeType: "text/html", body: { data: b64url("<p>html body</p>") } },
      ],
    };
    expect(extractPlainTextBody(payload)).toBe("plain body");
  });

  it("recurses into a nested multipart/mixed with an attachment", () => {
    const payload: Part = {
      mimeType: "multipart/mixed",
      parts: [
        {
          mimeType: "multipart/alternative",
          parts: [
            { mimeType: "text/plain", body: { data: b64url("崇拜程序") } },
            { mimeType: "text/html", body: { data: b64url("<p>x</p>") } },
          ],
        },
        { mimeType: "application/pdf", filename: "bulletin.pdf", body: { size: 1024 } },
      ],
    };
    expect(extractPlainTextBody(payload)).toBe("崇拜程序");
  });

  it("returns null for an HTML-only message rather than guessing", () => {
    const payload: Part = {
      mimeType: "multipart/alternative",
      parts: [{ mimeType: "text/html", body: { data: b64url("<p>html only</p>") } }],
    };
    expect(extractPlainTextBody(payload)).toBeNull();
  });

  it("returns null for a text/plain part with no body data", () => {
    expect(extractPlainTextBody({ mimeType: "text/plain", body: {} })).toBeNull();
  });

  it("returns null for an undefined payload", () => {
    expect(extractPlainTextBody(undefined)).toBeNull();
  });
});

describe("getHeader", () => {
  const payload: Part = {
    headers: [
      { name: "From", value: "Pastor <pastor@sccny.org>" },
      { name: "subject", value: "本周崇拜程序" },
    ],
  };

  it("finds a header by exact name", () => {
    expect(getHeader(payload, "From")).toBe("Pastor <pastor@sccny.org>");
  });

  it("matches case-insensitively, since Gmail does not normalize casing", () => {
    expect(getHeader(payload, "Subject")).toBe("本周崇拜程序");
  });

  it("returns an empty string for a missing header", () => {
    expect(getHeader(payload, "Reply-To")).toBe("");
  });

  it("returns an empty string for an undefined payload", () => {
    expect(getHeader(undefined, "From")).toBe("");
  });
});
