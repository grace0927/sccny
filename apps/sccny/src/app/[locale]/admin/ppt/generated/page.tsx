"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardContent } from "dark-blue";
import WorshipOrderSummary from "@/components/tools/ppt/WorshipOrderSummary";
import { WorshipOrderData } from "@/lib/parse-worship-order";

/** The worship program a deck was generated from, when one was recorded. */
interface GeneratedProgram {
  serviceDate: string;
  rawText?: string;
  data: WorshipOrderData;
}

interface DrivePresentation {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  /** Null for decks generated before programs were persisted */
  program: GeneratedProgram | null;
}

function formatDateTime(iso: string): string {
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

export default function GeneratedPptPage() {
  const [items, setItems] = useState<DrivePresentation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/ppt/generated");
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || `Server error ${res.status}`);
        }
        const json: { data: DrivePresentation[] } = await res.json();
        if (active) setItems(json.data);
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
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">已生成幻灯片</h1>
        <p className="text-muted-foreground text-sm mt-1">
          查看已生成并保存到共享云端硬盘文件夹中的崇拜幻灯片。点击标题可查看所用的崇拜程序。
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">加载中…</p>
      ) : !error && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无已生成的幻灯片。</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const title = item.name || "未命名";
            const isExpanded = expandedId === item.id;
            const panelId = `program-${item.id}`;
            return (
              <Card key={item.id}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      {item.program ? (
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          aria-controls={panelId}
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="flex items-center gap-1.5 font-medium text-foreground hover:underline max-w-full"
                        >
                          <span
                            aria-hidden="true"
                            className={`text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                          >
                            ▸
                          </span>
                          <span className="truncate">{title}</span>
                        </button>
                      ) : (
                        <p className="font-medium text-foreground truncate">{title}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-0.5">
                        生成时间：{formatDateTime(item.createdTime)}
                      </p>
                    </div>
                    <a
                      href={item.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <Button variant="outline" className="w-full sm:w-auto">
                        在 Google Slides 中打开
                      </Button>
                    </a>
                  </div>

                  {item.program && isExpanded && (
                    <div id={panelId}>
                      <WorshipOrderSummary
                        data={item.program.data}
                        serviceDate={item.program.serviceDate}
                        rawText={item.program.rawText}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
