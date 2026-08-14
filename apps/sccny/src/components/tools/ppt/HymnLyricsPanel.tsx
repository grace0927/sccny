"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "dark-blue";
import { HymnEntry } from "@/lib/parse-worship-order";

interface HymnCheckResult {
  number: string;
  title: string;
  status: "bank" | "db" | "missing";
  hymnId?: string;
  titleEn?: string;
  hasLyricsEn?: boolean;
}

interface LyricsDraft {
  expanded: boolean;
  loading: boolean;
  saving: boolean;
  fetched: boolean;
  titleEn: string;
  lyricsZh: string;
  lyricsEn: string;
  error: string | null;
}

const EMPTY_DRAFT: LyricsDraft = {
  expanded: false,
  loading: false,
  saving: false,
  fetched: false,
  titleEn: "",
  lyricsZh: "",
  lyricsEn: "",
  error: null,
};

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Availability check + lyrics-lookup workflow for the hymns in the review
 * step. Hymns missing from both the indexed hymn bank and the lyrics DB can
 * have their lyrics fetched from the web (christianstudy.com / hymnary.org),
 * reviewed, edited, and saved to the DB — generation then builds lyric
 * slides from the saved text.
 */
export default function HymnLyricsPanel({ hymns }: { hymns: HymnEntry[] }) {
  const [results, setResults] = useState<HymnCheckResult[]>([]);
  const [drafts, setDrafts] = useState<Record<string, LyricsDraft>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkKey = hymns.map((h) => `${h.number}:${h.title}`).join("|");

  const runCheck = useCallback(async () => {
    const payload = hymns
      .filter((h) => h.number.trim() && !h.youtubeUrl)
      .map((h) => ({ number: h.number, title: h.title }));
    if (payload.length === 0) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch("/api/tools/ppt/check-hymns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hymns: payload }),
      });
      if (res.ok) {
        const json = await res.json();
        setResults(json.hymns ?? []);
      }
    } catch {
      // non-fatal: badges simply don't show
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkKey]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runCheck, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runCheck]);

  function updateDraft(number: string, patch: Partial<LyricsDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [number]: { ...(prev[number] ?? EMPTY_DRAFT), ...patch },
    }));
  }

  async function fetchLyrics(result: HymnCheckResult, titleEnOverride?: string) {
    const number = result.number;
    const draft = drafts[number] ?? EMPTY_DRAFT;
    const titleEn = titleEnOverride ?? draft.titleEn ?? result.titleEn ?? "";
    updateDraft(number, { expanded: true, loading: true, error: null });
    try {
      const res = await fetch("/api/tools/ppt/fetch-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: parseInt(number, 10), titleEn: titleEn || undefined }),
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      updateDraft(number, {
        loading: false,
        fetched: true,
        lyricsZh: json.zh?.lyricsZh ?? draft.lyricsZh,
        lyricsEn: json.en?.lyricsEn ?? draft.lyricsEn,
        titleEn: json.en?.titleEn ?? titleEn,
        error: json.zh || json.en ? null : "未能从网上找到歌词，请手动输入",
      });
    } catch {
      updateDraft(number, { loading: false, error: "查找歌词失败，请稍后重试" });
    }
  }

  async function saveLyrics(result: HymnCheckResult) {
    const number = result.number;
    const draft = drafts[number];
    if (!draft || !draft.lyricsZh.trim()) {
      updateDraft(number, { error: "请先填写中文歌词" });
      return;
    }
    updateDraft(number, { saving: true, error: null });
    try {
      const res = await fetch("/api/tools/ppt/save-hymn-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: parseInt(number, 10),
          titleZh: result.title,
          titleEn: draft.titleEn.trim() || undefined,
          lyricsZh: draft.lyricsZh,
          lyricsEn: draft.lyricsEn.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      updateDraft(number, { saving: false, expanded: false });
      await runCheck();
    } catch {
      updateDraft(number, { saving: false, error: "保存失败，请稍后重试" });
    }
  }

  if (results.length === 0) return null;

  return (
    <div className="space-y-2">
      {results.map((r) => {
        const draft = drafts[r.number] ?? EMPTY_DRAFT;
        return (
          <div key={r.number} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground font-medium">
                {r.number} {r.title}
              </span>
              {r.status === "bank" && (
                <span className="rounded-full bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 px-2 py-0.5 text-xs">
                  ✓ 诗歌库
                </span>
              )}
              {r.status === "db" && (
                <span className="rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-xs">
                  ✓ 数据库歌词{r.hasLyricsEn ? "（中英）" : "（仅中文）"}
                </span>
              )}
              {r.status === "missing" && (
                <>
                  <span className="rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 text-xs">
                    ⚠ 缺少歌词
                  </span>
                  {!draft.expanded && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLyrics(r, r.titleEn)}
                    >
                      查找歌词
                    </Button>
                  )}
                </>
              )}
            </div>

            {r.status === "missing" && draft.expanded && (
              <div className="space-y-2">
                {draft.loading && (
                  <p className="text-sm text-muted-foreground">正在从网上查找歌词…</p>
                )}
                {!draft.loading && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        className={inputClass}
                        value={draft.titleEn}
                        onChange={(e) => updateDraft(r.number, { titleEn: e.target.value })}
                        placeholder="英文标题（用于查找英文歌词，选填）"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLyrics(r, draft.titleEn)}
                        disabled={draft.loading}
                      >
                        重新查找
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        中文歌词（每段之间用空行分隔）
                      </label>
                      <textarea
                        className={`${inputClass} min-h-[140px]`}
                        value={draft.lyricsZh}
                        onChange={(e) => updateDraft(r.number, { lyricsZh: e.target.value })}
                        placeholder="中文歌词"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        英文歌词（选填，每段之间用空行分隔，与中文段落一一对应）
                      </label>
                      <textarea
                        className={`${inputClass} min-h-[140px]`}
                        value={draft.lyricsEn}
                        onChange={(e) => updateDraft(r.number, { lyricsEn: e.target.value })}
                        placeholder="英文歌词"
                      />
                    </div>
                    {draft.error && <p className="text-sm text-destructive">{draft.error}</p>}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => saveLyrics(r)}
                        disabled={draft.saving}
                      >
                        {draft.saving ? "保存中…" : "保存歌词"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateDraft(r.number, { expanded: false })}
                      >
                        取消
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
