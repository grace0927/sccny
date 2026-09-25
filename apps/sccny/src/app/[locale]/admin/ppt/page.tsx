"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import WorshipTextInput from "@/components/tools/ppt/WorshipTextInput";
import WorshipOrderReviewForm from "@/components/tools/ppt/WorshipOrderReviewForm";
import SlideGenerationResult from "@/components/tools/ppt/SlideGenerationResult";
import { WorshipOrderData } from "@/lib/parse-worship-order";
import { getComingSunday, isFirstSundayOfMonth, parseServiceDate, toDateInputValue } from "@/lib/service-date";

type Step = "input" | "review" | "result";

interface GenerationResult {
  presentationUrl: string;
  presentationId: string;
  missingHymns: string[];
}

/** One rejected scripture reference from generate-slides' 400 response. */
interface InvalidRef {
  field: string;
  ref: string;
  reason: string;
}

/** A job row as returned by `/api/admin/ppt/jobs/[id]`. */
interface SlideJob {
  rawText: string;
  parsedData: WorshipOrderData | null;
  serviceDate: string | null;
}

function AdminPptGeneration() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");

  const [step, setStep] = useState<Step>("input");
  const [serviceDate, setServiceDate] = useState(() => toDateInputValue(getComingSunday()));
  const [parsed, setParsed] = useState<WorshipOrderData | null>(null);
  const [rawText, setRawText] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reviewing an email-triggered deck: seed the wizard from the stored job and
  // jump straight to step 2, so the operator gets the full review experience
  // (verse preview, hymn lyrics check, per-field editing) and can regenerate.
  useEffect(() => {
    if (!jobId) return;
    let active = true;
    async function loadJob() {
      setIsLoadingJob(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/ppt/jobs/${jobId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `Server error ${res.status}`);
        }
        const { data }: { data: SlideJob } = await res.json();
        if (!active) return;
        setRawText(data.rawText);
        if (data.serviceDate) {
          setServiceDate(toDateInputValue(new Date(data.serviceDate)));
        }
        if (data.parsedData) {
          setParsed(data.parsedData);
          setStep("review");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "加载任务失败");
      } finally {
        if (active) setIsLoadingJob(false);
      }
    }
    loadJob();
    return () => {
      active = false;
    };
  }, [jobId]);

  function handleParsed(data: WorshipOrderData, text: string) {
    setRawText(text);
    // Default communion to true on the first Sunday of the selected month
    const sunday = parseServiceDate(serviceDate) ?? getComingSunday();
    setParsed({ ...data, hasCommunion: data.hasCommunion || isFirstSundayOfMonth(sunday) });
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
        body: JSON.stringify({ ...data, serviceDate }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // Invalid scripture references are reported per field so the operator
        // knows exactly which one to fix. No deck was created.
        if (Array.isArray(json.invalidRefs) && json.invalidRefs.length > 0) {
          const details = (json.invalidRefs as InvalidRef[])
            .map((r) => `${r.field}「${r.ref}」：${r.reason}`)
            .join("；");
          throw new Error(`${json.error ?? "经文引用无效"} — ${details}`);
        }
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
    setServiceDate(toDateInputValue(getComingSunday()));
    setParsed(null);
    setRawText(undefined);
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

      {isLoadingJob && (
        <p className="text-sm text-muted-foreground">加载邮件任务中…</p>
      )}

      {!isLoadingJob && step === "input" && (
        <WorshipTextInput
          key={rawText ?? "blank"}
          onParsed={handleParsed}
          serviceDate={serviceDate}
          onServiceDateChange={setServiceDate}
          initialText={rawText}
        />
      )}

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

export default function AdminPptGenerationPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">加载中…</p>}>
      <AdminPptGeneration />
    </Suspense>
  );
}
