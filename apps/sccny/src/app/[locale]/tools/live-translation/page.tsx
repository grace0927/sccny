"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TranslationViewer from "@/components/tools/TranslationViewer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
  Alert,
  AlertDescription,
} from "dark-blue";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

interface TranslationSession {
  id: string;
  title: string;
  status: string;
  language: string;
  startedAt: string;
  endedAt: string | null;
  _count: { entries: number };
}

export default function LiveTranslationPage() {
  const t = useTranslations("LiveTranslation");
  const [sessions, setSessions] = useState<TranslationSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fontSize, setFontSize] = useState(20);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/tools/translation/sessions?status=ACTIVE");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data);
        // Auto-select the first active session if none selected
        if (data.data.length > 0 && !selectedSession) {
          setSelectedSession(data.data[0].id);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchActiveSessions();
    // Refresh session list every 10 seconds
    const interval = setInterval(fetchActiveSessions, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("title")}
            </h1>
            <p className="text-muted-foreground">{t("description")}</p>
            <div className="flex gap-2 mt-4">
              <Link href="/tools/live-translation/history">
                <Button variant="outline" size="sm">
                  {t("viewHistory")}
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <Alert>
              <AlertDescription>{t("noActiveSessions")}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Session Selector (sidebar on large screens) */}
              {sessions.length > 1 && (
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {t("activeSessions")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {sessions.map((session) => (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            selectedSession === session.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/50"
                          )}
                        >
                          <p className="font-medium text-foreground text-sm">
                            {session.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {session.language === "zh" ? "CN" : "EN"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {session._count.entries} {t("entries")}
                            </span>
                          </div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Viewer */}
              <div
                className={cn(
                  sessions.length > 1 ? "lg:col-span-3" : "lg:col-span-4"
                )}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {sessions.find((s) => s.id === selectedSession)
                          ?.title || t("liveTranslation")}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFontSize((s) => Math.max(14, s - 2))
                          }
                        >
                          A-
                        </Button>
                        <span className="text-sm w-8 text-center">
                          {fontSize}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setFontSize((s) => Math.min(40, s + 2))
                          }
                        >
                          A+
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TranslationViewer
                      sessionId={selectedSession}
                      fontSize={fontSize}
                      maxHeight="65vh"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
