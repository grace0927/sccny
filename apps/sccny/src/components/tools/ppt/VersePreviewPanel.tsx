"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VerseSegment } from "@/lib/bible-reference";
import { collectScriptureRefs, type WorshipOrderData } from "@/lib/parse-worship-order";

interface PreviewState {
  status: "loading" | "ok" | "error";
  segments: VerseSegment[];
  message: string;
}

interface ApiResult {
  field: string;
  ref: string;
  ok: boolean;
  segments?: VerseSegment[];
  error?: { code: string; message: string };
}

const DEBOUNCE_MS = 500;

/**
 * Resolve every scripture reference in the worship order so the operator can
 * confirm the actual verse text before a deck is generated.
 *
 * Returns one entry per field that currently holds a reference. `hasError` is
 * true while any reference is invalid — the review form uses it to block
 * generation, which the generate-slides route rejects anyway.
 */
export function useVersePreview(data: WorshipOrderData): {
  results: Record<string, PreviewState>;
  hasError: boolean;
} {
  const [results, setResults] = useState<Record<string, PreviewState>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef(0);

  const refs = collectScriptureRefs(data);
  const refsKey = refs.map(({ field, ref }) => `${field}=${ref}`).join("|");

  const run = useCallback(async () => {
    if (refs.length === 0) {
      setResults({});
      return;
    }

    const requestId = ++requestRef.current;
    setResults((prev) =>
      Object.fromEntries(
        refs.map(({ field }) => [
          field,
          // Keep the previous text visible while re-fetching so the panel
          // doesn't flicker empty on every keystroke.
          prev[field]
            ? { ...prev[field], status: "loading" as const }
            : { status: "loading" as const, segments: [], message: "" },
        ])
      )
    );

    try {
      const res = await fetch("/api/tools/ppt/preview-verses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refs: refs.map(({ field, ref }) => ({ field, ref })) }),
      });
      // A stale response must not overwrite a newer one.
      if (requestId !== requestRef.current) return;

      if (!res.ok) {
        const message =
          res.status === 503 ? "经文数据源未配置，无法预览" : "查找经文失败，请稍后重试";
        setResults(
          Object.fromEntries(
            refs.map(({ field }) => [field, { status: "error" as const, segments: [], message }])
          )
        );
        return;
      }

      const json: { results?: ApiResult[] } = await res.json();
      setResults(
        Object.fromEntries(
          (json.results ?? []).map((r) => [
            r.field,
            r.ok
              ? { status: "ok" as const, segments: r.segments ?? [], message: "" }
              : { status: "error" as const, segments: [], message: r.error?.message ?? "经文引用无效" },
          ])
        )
      );
    } catch {
      if (requestId !== requestRef.current) return;
      setResults(
        Object.fromEntries(
          refs.map(({ field }) => [
            field,
            { status: "error" as const, segments: [], message: "查找经文失败，请稍后重试" },
          ])
        )
      );
    }
    // refsKey captures every input that affects the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refsKey]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(run, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [run]);

  const hasError = Object.values(results).some((r) => r.status === "error");
  return { results, hasError };
}

/**
 * The resolved verse text for one scripture field, shown directly under its
 * input: the reference as the sheet resolved it, then the Chinese and English
 * text that will appear on the slides.
 */
export function VersePreview({ state }: { state?: PreviewState }) {
  if (!state) return null;

  if (state.status === "error") {
    return (
      <p className="text-xs text-destructive flex items-start gap-1">
        <span aria-hidden="true">✗</span>
        <span>{state.message}</span>
      </p>
    );
  }

  const loading = state.status === "loading";

  if (state.segments.length === 0) {
    return loading ? <p className="text-xs text-muted-foreground">查找经文中…</p> : null;
  }

  return (
    <div className={loading ? "space-y-2 opacity-50" : "space-y-2"}>
      {state.segments.map((seg, i) => (
        <div key={i} className="rounded-md border border-input bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-foreground flex flex-wrap items-center gap-x-2">
            <span aria-hidden="true" className="text-primary">✓</span>
            <span>{seg.zhTitle}</span>
            {seg.enTitle !== seg.zhTitle && (
              <span className="text-muted-foreground">· {seg.enTitle}</span>
            )}
            <span className="text-muted-foreground">（{seg.zhVerses.length} 节）</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {seg.zhVerses.join(" ")}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {seg.enVerses.join(" ")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
