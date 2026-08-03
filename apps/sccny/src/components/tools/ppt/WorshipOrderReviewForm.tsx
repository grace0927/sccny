"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, CardFooter } from "dark-blue";
import { WorshipOrderData, HymnEntry } from "@/lib/parse-worship-order";
import HymnLyricsPanel from "./HymnLyricsPanel";
import { VersePreview, useVersePreview } from "./VersePreviewPanel";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface WorshipOrderReviewFormProps {
  parsed: WorshipOrderData;
  onBack: () => void;
  onGenerate: (data: WorshipOrderData) => Promise<void>;
  isGenerating: boolean;
}

export default function WorshipOrderReviewForm({
  parsed,
  onBack,
  onGenerate,
  isGenerating,
}: WorshipOrderReviewFormProps) {
  const [data, setData] = useState<WorshipOrderData>(parsed);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preview = useVersePreview(data);

  useEffect(() => {
    if (isGenerating) {
      setProgress(0);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return prev;
          return prev + (85 - prev) * 0.04;
        });
      }, 400);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isGenerating]);

  function updateHymn(index: number, field: keyof HymnEntry, value: string) {
    setData((prev) => {
      const hymns = [...prev.hymns];
      hymns[index] = { ...hymns[index], [field]: value };
      return { ...prev, hymns };
    });
  }

  function removeHymn(index: number) {
    setData((prev) => ({
      ...prev,
      hymns: prev.hymns.filter((_, i) => i !== index),
    }));
  }

  function update(field: keyof WorshipOrderData, value: unknown) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>第二步：核对并确认信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sermon info */}
        <section className="space-y-3">
          <h3 className="font-semibold text-foreground">证道信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">证道题目</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={data.sermonTitle}
                onChange={(e) => update("sermonTitle", e.target.value)}
                placeholder="证道题目"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">副题</label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={data.sermonSubtitle}
                onChange={(e) => update("sermonSubtitle", e.target.value)}
                placeholder="证道副题（选填）"
              />
            </div>
          </div>
        </section>

        {/* Scripture refs — each shows the verses that will land on its slide */}
        <section className="space-y-3">
          <h3 className="font-semibold text-foreground">经文与金句</h3>
          <p className="text-xs text-muted-foreground">
            支持跨章引用（如 约翰福音1:1-2:2）、繁体与英文书卷名。请核对下方经文内容再生成。
          </p>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">宣召经文引用</label>
              <input
                className={inputClass}
                value={data.callToWorship}
                onChange={(e) => update("callToWorship", e.target.value)}
                placeholder="如：诗篇51"
              />
              {data.callToWorshipCustomText?.trim() ? (
                <p className="text-xs text-muted-foreground">已填写自定义文字，将不查找经文。</p>
              ) : (
                <VersePreview state={preview.results.callToWorship} />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                宣召自定义文字
                <span className="ml-1 text-xs font-normal text-muted-foreground/70">（选填；填写后将直接显示此文字，不查找经文）</span>
              </label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                value={data.callToWorshipCustomText ?? ""}
                onChange={(e) => update("callToWorshipCustomText", e.target.value)}
                placeholder="如：你们要赞美耶和华！因歌颂我们的神为善为美，颂赞的话是合宜的。"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">认罪祷告</label>
              <input
                className={inputClass}
                value={data.confessionPrayer}
                onChange={(e) => update("confessionPrayer", e.target.value)}
                placeholder="如：诗篇51：1-4"
              />
              <VersePreview state={preview.results.confessionPrayer} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">宣告赦免</label>
              <input
                className={inputClass}
                value={data.assuranceOfPardon}
                onChange={(e) => update("assuranceOfPardon", e.target.value)}
                placeholder="如：罗马书8：1-2"
              />
              <VersePreview state={preview.results.assuranceOfPardon} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">经文</label>
              <input
                className={inputClass}
                value={data.scriptureReading}
                onChange={(e) => update("scriptureReading", e.target.value)}
                placeholder="如：哥林多前书第五章"
              />
              <VersePreview state={preview.results.scriptureReading} />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">金句</label>
              <input
                className={inputClass}
                value={data.memoryVerse}
                onChange={(e) => update("memoryVerse", e.target.value)}
                placeholder="如：帖撒罗尼迦前书4：3-5"
              />
              <VersePreview state={preview.results.memoryVerse} />
            </div>
          </div>
        </section>

        {/* Hymns */}
        <section className="space-y-3">
          <h3 className="font-semibold text-foreground">诗歌</h3>
          {data.hymns.length === 0 && (
            <p className="text-sm text-muted-foreground">未检测到诗歌</p>
          )}
          <div className="space-y-3">
            {data.hymns.map((hymn, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    className="w-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={hymn.number}
                    onChange={(e) => updateHymn(i, "number", e.target.value)}
                    placeholder="编号"
                  />
                  <input
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={hymn.title}
                    onChange={(e) => updateHymn(i, "title", e.target.value)}
                    placeholder="诗歌名称"
                  />
                  <button
                    type="button"
                    onClick={() => removeHymn(i)}
                    className="text-muted-foreground hover:text-destructive text-sm px-2"
                  >
                    删除
                  </button>
                </div>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={hymn.youtubeUrl ?? ""}
                  onChange={(e) => updateHymn(i, "youtubeUrl", e.target.value)}
                  placeholder="YouTube 链接（选填，填写后以视频幻灯片替代歌词）"
                />
              </div>
            ))}
          </div>
          {/* Availability check + lyrics lookup for hymns not in the bank */}
          <HymnLyricsPanel hymns={data.hymns} />
        </section>

        {/* Communion toggle */}
        <section className="flex items-center gap-3">
          <input
            id="hasCommunion"
            type="checkbox"
            checked={data.hasCommunion}
            onChange={(e) => update("hasCommunion", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="hasCommunion" className="text-sm font-medium text-foreground">
            包含圣餐
          </label>
        </section>
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {isGenerating && (
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>正在生成幻灯片，请稍候…</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-400 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {preview.hasError && !isGenerating && (
          <p className="w-full text-sm text-destructive">
            有经文引用无法找到，请修正后再生成幻灯片。
          </p>
        )}
        <div className="flex justify-between w-full">
          <Button variant="outline" onClick={onBack} disabled={isGenerating}>
            ← 返回修改
          </Button>
          <Button onClick={() => onGenerate(data)} disabled={isGenerating || preview.hasError}>
            {isGenerating ? "生成中..." : "生成幻灯片"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
