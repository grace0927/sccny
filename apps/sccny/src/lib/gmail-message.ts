import type { gmail_v1 } from "googleapis";

/**
 * Decode a Gmail API body payload.
 *
 * Gmail returns body data base64url-encoded (`-`/`_` instead of `+`/`/`, padding
 * stripped). Node's "base64" decoder handles base64url since v16, but the
 * translation is done explicitly here so the intent survives a runtime change.
 */
export function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

/**
 * Depth-first search for the first `text/plain` part with a body.
 *
 * A worship-procedure email is typically `multipart/alternative` (plain + HTML),
 * and may be wrapped in a `multipart/mixed` when the sender attaches something,
 * so the search has to recurse rather than only look one level down. Returns
 * null when the message carries no plain-text part at all — the caller fails the
 * job with a clear message rather than guessing at stripped HTML.
 */
export function extractPlainTextBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): string | null {
  if (!payload) return null;

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  for (const part of payload.parts ?? []) {
    const found = extractPlainTextBody(part);
    if (found !== null) return found;
  }

  return null;
}

/** Case-insensitive header lookup — Gmail does not normalize header casing. */
export function getHeader(
  payload: gmail_v1.Schema$MessagePart | undefined,
  name: string
): string {
  const target = name.toLowerCase();
  const header = payload?.headers?.find((h) => h.name?.toLowerCase() === target);
  return header?.value ?? "";
}
