"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent } from "dark-blue";
import { Link } from "@/i18n/navigation";

type JobStatus = "PENDING" | "PARSED" | "GENERATED" | "REVIEWED" | "FAILED";

interface SlideJob {
  id: string;
  emailFrom: string;
  emailSubject: string;
  emailReceivedAt: string;
  serviceDate: string | null;
  parseSource: string | null;
  status: JobStatus;
  presentationUrl: string | null;
  missingHymns: string[];
  errorMessage: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "待解析",
  PARSED: "已解析",
  GENERATED: "待审核",
  REVIEWED: "已审核",
  FAILED: "失败",
};

const STATUS_CLASS: Record<JobStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  PARSED: "bg-muted text-muted-foreground",
  GENERATED: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  REVIEWED: "bg-green-500/10 text-green-600 dark:text-green-400",
  FAILED: "bg-destructive/10 text-destructive",
};

/**
 * A job that never reached a deck can be re-run.
 *
 * FAILED is the common case, but a run cut short mid-generation (function
 * timeout, container recycle) strands a job at PENDING/PARSED: the unique
 * gmailMessageId means the next cron skips it, so the only way back is here.
 */
function isRetryable(status: JobStatus): boolean {
  return status === "PENDING" || status === "PARSED" || status === "FAILED";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Sender header is "Name <addr@host>"; show the friendly part when there is one. */
function formatSender(from: string): string {
  const match = /^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/.exec(from);
  const name = match?.[1]?.trim();
  return name || from || "—";
}

export default function PendingSlidesPage() {
  const [jobs, setJobs] = useState<SlideJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Bumped after every mutation to re-run the fetch effect.
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/admin/ppt/jobs");
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `Server error ${res.status}`);
        }
        const json: { data: SlideJob[] } = await res.json();
        if (active) setJobs(json.data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "加载失败，请重试");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function act(
    id: string,
    request: () => Promise<Response>,
    fallbackMessage: string
  ) {
    setBusyId(id);
    setError(null);
    try {
      const res = await request();
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `Server error ${res.status}`);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : fallbackMessage);
    } finally {
      setBusyId(null);
    }
  }

  const markReviewed = (id: string) =>
    act(
      id,
      () =>
        fetch(`/api/admin/ppt/jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "REVIEWED" }),
        }),
      "标记失败，请重试"
    );

  const retry = (id: string) =>
    act(id, () => fetch(`/api/admin/ppt/jobs/${id}/retry`, { method: "POST" }), "重试失败");

  const remove = (id: string) =>
    act(id, () => fetch(`/api/admin/ppt/jobs/${id}`, { method: "DELETE" }), "删除失败");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">待审核幻灯片</h1>
        <p className="text-muted-foreground text-sm mt-1">
          由崇拜程序邮件自动生成的幻灯片。请在主日前核对内容，确认无误后标记为已审核。
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无邮件生成的幻灯片。</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const isBusy = busyId === job.id;
            return (
              <Card key={job.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          主日 {formatDate(job.serviceDate)}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CLASS[job.status]}`}
                        >
                          {STATUS_LABEL[job.status]}
                        </span>
                        {job.parseSource === "rule-based" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            规则解析（请仔细核对）
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {job.emailSubject || "（无主题）"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        来自 {formatSender(job.emailFrom)} ·{" "}
                        {formatDateTime(job.emailReceivedAt)}
                      </p>
                    </div>
                  </div>

                  {job.missingHymns.length > 0 && (
                    <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                      以下诗歌缺少歌词或诗歌库幻灯片：{job.missingHymns.join("、")}
                    </div>
                  )}

                  {job.errorMessage && (
                    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                      {job.errorMessage}
                    </div>
                  )}

                  {job.status === "REVIEWED" && (
                    <p className="text-xs text-muted-foreground">
                      已由 {job.reviewedBy || "—"} 于 {formatDateTime(job.reviewedAt)} 审核
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {job.presentationUrl && (
                      <a
                        href={job.presentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline">在 Google Slides 中打开</Button>
                      </a>
                    )}
                    <Link href={`/admin/ppt?jobId=${job.id}`}>
                      <Button variant="outline" disabled={isBusy}>
                        在工具中审核
                      </Button>
                    </Link>
                    {job.status === "GENERATED" && (
                      <Button onClick={() => markReviewed(job.id)} disabled={isBusy}>
                        {isBusy ? "处理中…" : "标记已审核"}
                      </Button>
                    )}
                    {isRetryable(job.status) && (
                      <Button onClick={() => retry(job.id)} disabled={isBusy}>
                        {isBusy ? "重试中…" : "重试"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => remove(job.id)}
                      disabled={isBusy}
                    >
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
