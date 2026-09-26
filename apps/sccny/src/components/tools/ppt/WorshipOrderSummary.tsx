import type { ReactNode } from "react";
import { SCRIPTURE_FIELDS, WorshipOrderData } from "@/lib/parse-worship-order";

interface WorshipOrderSummaryProps {
  /** The worship order as it was used for generation (after step-2 edits) */
  data: WorshipOrderData;
  /** Service date, `YYYY-MM-DD` */
  serviceDate?: string;
  /** Verbatim program text the operator pasted, if it was captured */
  rawText?: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground shrink-0 w-20">{label}</span>
      <span className="text-foreground min-w-0 break-words">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </p>
      {children}
    </div>
  );
}

const badgeClass =
  "rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 text-xs shrink-0";

/**
 * The full worship program a deck was generated from — shown on the wizard's
 * result step and on the generated-slides list. Read-only; the editable version
 * is WorshipOrderReviewForm.
 */
export default function WorshipOrderSummary({
  data,
  serviceDate,
  rawText,
}: WorshipOrderSummaryProps) {
  // Only the references that were actually looked up are worth showing, and 宣召
  // is replaced by its custom text when one was entered — same rule as
  // collectScriptureRefs() uses when generating.
  const scriptures = SCRIPTURE_FIELDS.map(({ field, label }) => {
    if (field === "callToWorship" && data.callToWorshipCustomText) {
      return { label, value: data.callToWorshipCustomText };
    }
    return { label, value: data[field] ?? "" };
  }).filter((s) => s.value.trim() !== "");

  // `data` may come straight out of a Json column, so don't trust the arrays.
  const hymns = data.hymns ?? [];
  const otherLines = data.otherLines ?? [];

  return (
    <div className="rounded-md border border-border bg-muted/30 p-4 space-y-4">
      <Section title="崇拜信息">
        <div className="space-y-1">
          {serviceDate && <Field label="崇拜日期" value={serviceDate} />}
          {data.sermonTitle && <Field label="证道题目" value={data.sermonTitle} />}
          {data.sermonSubtitle && <Field label="副题" value={data.sermonSubtitle} />}
          {data.speaker && <Field label="讲员" value={data.speaker} />}
          {data.hasCommunion && <Field label="圣餐" value="包含圣餐" />}
        </div>
      </Section>

      {hymns.length > 0 && (
        <Section title="诗歌">
          <ul className="space-y-1">
            {hymns.map((h, i) => (
              <li key={`${h.number}-${i}`} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-foreground">
                  {h.number && <span className="text-muted-foreground mr-1.5">{h.number}</span>}
                  {h.title}
                </span>
                {h.isResponse && <span className={badgeClass}>回应诗歌</span>}
                {h.youtubeUrl && <span className={badgeClass}>YouTube</span>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {scriptures.length > 0 && (
        <Section title="经文">
          <div className="space-y-1">
            {scriptures.map((s) => (
              <Field key={s.label} label={s.label} value={s.value} />
            ))}
          </div>
        </Section>
      )}

      {otherLines.length > 0 && (
        <Section title="其他程序">
          <ul className="space-y-0.5">
            {otherLines.map((line, i) => (
              <li key={`${line}-${i}`} className="text-sm text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {rawText && (
        <details>
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground">
            原始程序文本
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-input bg-background p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
