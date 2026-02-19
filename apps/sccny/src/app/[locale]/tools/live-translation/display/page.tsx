"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface TranslationEntry {
  id: string;
  sessionId: string;
  text: string;
  language: string;
  createdAt: string;
}

export default function TranslationDisplayPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const paramFontSize = searchParams.get("fontSize");
  const paramLines = searchParams.get("lines");

  const fontSize = paramFontSize ? parseInt(paramFontSize) : 48;
  const maxLines = paramLines ? parseInt(paramLines) : 5;

  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [autoSessionId, setAutoSessionId] = useState<string | null>(
    sessionId
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // If no session ID provided, find the active one
  useEffect(() => {
    if (sessionId) return;

    const findActive = async () => {
      try {
        const res = await fetch(
          "/api/tools/translation/sessions?status=ACTIVE"
        );
        if (res.ok) {
          const data = await res.json();
          if (data.data.length > 0) {
            setAutoSessionId(data.data[0].id);
          }
        }
      } catch {
        // Retry in 5 seconds
      }
    };

    findActive();
    const interval = setInterval(findActive, 5000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Connect to SSE stream
  useEffect(() => {
    const sid = sessionId || autoSessionId;
    if (!sid) return;

    const eventSource = new EventSource(
      `/api/tools/translation/sessions/${sid}/stream`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "initial") {
          setEntries(data.entries);
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
        // Ignore parse errors
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, autoSessionId, scrollToBottom]);

  // Show only the latest N entries
  const visibleEntries = entries.slice(-maxLines);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Connection indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div
          className={cn(
            "h-3 w-3 rounded-full",
            isConnected
              ? "bg-green-500 animate-pulse"
              : isEnded
                ? "bg-gray-500"
                : "bg-red-500 animate-pulse"
          )}
        />
      </div>

      {/* Main content */}
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col justify-end p-8 overflow-hidden"
      >
        {!autoSessionId && !sessionId ? (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-gray-500 text-center"
              style={{ fontSize: `${fontSize * 0.6}px` }}
            >
              Waiting for active session...
            </p>
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p
              className="text-gray-500 text-center"
              style={{ fontSize: `${fontSize * 0.6}px` }}
            >
              Waiting for translation...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={cn(
                  "transition-opacity duration-500",
                  index === visibleEntries.length - 1
                    ? "opacity-100"
                    : index === visibleEntries.length - 2
                      ? "opacity-70"
                      : "opacity-40"
                )}
              >
                <p
                  className="leading-relaxed font-medium"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {entry.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {isEnded && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-2xl">Session ended</p>
          </div>
        )}
      </div>
    </div>
  );
}
