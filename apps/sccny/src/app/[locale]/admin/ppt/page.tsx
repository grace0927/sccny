"use client";

import { useState } from "react";
import WorshipTextInput from "@/components/tools/ppt/WorshipTextInput";
import WorshipOrderReviewForm from "@/components/tools/ppt/WorshipOrderReviewForm";
import SlideGenerationResult from "@/components/tools/ppt/SlideGenerationResult";
import { WorshipOrderData } from "@/lib/parse-worship-order";

type Step = "input" | "review" | "result";

/** Returns true if the coming Sunday is the first Sunday of its month (date 1–7). */
function isFirstSundayOfMonth(): boolean {
  const today = new Date();
  const daysUntilSunday = today.getDay() === 0 ? 0 : 7 - today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);
  return sunday.getDate() <= 7;
}

interface GenerationResult {
  presentationUrl: string;
  presentationId: string;
  missingHymns: string[];
}

export default function AdminPptGenerationPage() {
  const [step, setStep] = useState<Step>("input");
  const [parsed, setParsed] = useState<WorshipOrderData | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleParsed(data: WorshipOrderData) {
    // Default communion to true on the first Sunday of the month
    setParsed({ ...data, hasCommunion: data.hasCommunion || isFirstSundayOfMonth() });
    setStep("review");
    setError(null);
  }

  async function handleGenerate(data: WorshipOrderData) {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/ppt/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Server error ${res.status}`);
      }
      const json: GenerationResult = await res.json();
      setResult(json);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStartOver() {
    setStep("input");
    setParsed(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">生成PPT</h1>
        <p className="text-muted-foreground text-sm mt-1">
          输入本周崇拜程序，自动生成 Google Slides 幻灯片。
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className={step === "input" ? "font-semibold text-primary" : "text-muted-foreground"}>
          1. 输入程序
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={step === "review" ? "font-semibold text-primary" : "text-muted-foreground"}>
          2. 核对信息
        </span>
        <span className="text-muted-foreground">→</span>
        <span className={step === "result" ? "font-semibold text-primary" : "text-muted-foreground"}>
          3. 生成完成
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {step === "input" && <WorshipTextInput onParsed={handleParsed} />}

      {step === "review" && parsed && (
        <WorshipOrderReviewForm
          parsed={parsed}
          onBack={() => setStep("input")}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      )}

      {step === "result" && result && (
        <SlideGenerationResult
          presentationUrl={result.presentationUrl}
          presentationId={result.presentationId}
          missingHymns={result.missingHymns}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
}
