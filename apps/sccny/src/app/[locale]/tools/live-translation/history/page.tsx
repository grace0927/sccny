"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
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

interface TranslationEntry {
  id: string;
  text: string;
  language: string;
  createdAt: string;
}

export default function TranslationHistoryPage() {
  const t = useTranslations("LiveTranslation");
  const [sessions, setSessions] = useState<TranslationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tools/translation/sessions?status=ENDED&page=${page}&limit=20`
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleViewSession = useCallback(async (sessionId: string) => {
    setSelectedSession(sessionId);
    setIsLoadingEntries(true);
    try {
      const res = await fetch(
        `/api/tools/translation/sessions/${sessionId}/entries`
      );
      if (res.ok) {
        const data = await res.json();
        setEntries(data.data);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingEntries(false);
    }
  }, []);

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("historyTitle")}
            </h1>
            <p className="text-muted-foreground">{t("historyDescription")}</p>
            <div className="mt-4">
              <Link href="/tools/live-translation">
                <Button variant="outline" size="sm">
                  {t("backToLive")}
                </Button>
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : sessions.length === 0 ? (
            <Alert>
              <AlertDescription>{t("noHistory")}</AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Session List */}
              <div className="lg:col-span-1 space-y-3">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleViewSession(session.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-colors",
                      selectedSession === session.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <p className="font-medium text-foreground">
                      {session.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {session.language === "zh" ? "CN" : "EN"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {session._count.entries} {t("entries")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(session.startedAt).toLocaleDateString()}{" "}
                      {new Date(session.startedAt).toLocaleTimeString()}
                    </p>
                    {session.endedAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("duration")}:{" "}
                        {Math.round(
                          (new Date(session.endedAt).getTime() -
                            new Date(session.startedAt).getTime()) /
                            60000
                        )}{" "}
                        {t("minutes")}
                      </p>
                    )}
                  </button>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      {t("previous")}
                    </Button>
                    <span className="text-sm text-muted-foreground self-center">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t("next")}
                    </Button>
                  </div>
                )}
              </div>

              {/* Entry Detail */}
              <div className="lg:col-span-2">
                {selectedSession ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {sessions.find((s) => s.id === selectedSession)?.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingEntries ? (
                        <div className="space-y-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-6 w-1/2" />
                          <Skeleton className="h-6 w-2/3" />
                        </div>
                      ) : entries.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {t("noEntries")}
                        </p>
                      ) : (
                        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-3 bg-muted/50 rounded-lg"
                            >
                              <p className="text-foreground leading-relaxed">
                                {entry.text}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {entry.language === "zh" ? "CN" : "EN"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    entry.createdAt
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        {t("selectSessionToView")}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
