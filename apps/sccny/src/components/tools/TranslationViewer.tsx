"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Skeleton } from "dark-blue";
import { cn } from "@/lib/utils";

interface TranslationEntry {
  id: string;
  sessionId: string;
  text: string;
  language: string;
  createdAt: string;
}

interface TranslationViewerProps {
  sessionId: string | null;
  fontSize?: number;
  className?: string;
  showTimestamps?: boolean;
  maxHeight?: string;
}

export default function TranslationViewer({
  sessionId,
  fontSize = 18,
  className,
  showTimestamps = true,
  maxHeight = "60vh",
}: TranslationViewerProps) {
  const t = useTranslations("LiveTranslation");
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsEnded(false);
    setEntries([]);

    // Close previous connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `/api/tools/translation/sessions/${sessionId}/stream`
    );
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "initial") {
          setEntries(data.entries);
          setIsLoading(false);
          setTimeout(scrollToBottom, 50);
        } else if (data.type === "entry") {
          setEntries((prev) => [...prev, data.entry]);
          setTimeout(scrollToBottom, 50);
        } else if (data.type === "ended") {
          setIsEnded(true);
          setIsConnected(false);
          eventSource.close();
        }
      } catch {
        // Ignore parse errors (heartbeats, etc.)
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setIsLoading(false);
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [sessionId, scrollToBottom]);

  if (!sessionId) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">{t("selectSession")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Connection status */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            isConnected ? "bg-green-500 animate-pulse" : isEnded ? "bg-gray-400" : "bg-red-500"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {isConnected ? t("connected") : isEnded ? t("sessionEnded") : t("disconnected")}
        </span>
        {isEnded && (
          <Badge variant="secondary">{t("ended")}</Badge>
        )}
      </div>

      {/* Entries */}
      <div
        ref={scrollRef}
        className="overflow-y-auto space-y-3 scroll-smooth"
        style={{ maxHeight }}
      >
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t("waitingForTranslation")}</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "p-3 rounded-lg transition-all",
                index === entries.length - 1
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-muted/50"
              )}
            >
              <p
                className={cn(
                  "text-foreground leading-relaxed",
                  index === entries.length - 1 && "font-medium"
                )}
                style={{ fontSize: `${fontSize}px` }}
              >
                {entry.text}
              </p>
              {showTimestamps && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {entry.language === "zh" ? "CN" : "EN"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
