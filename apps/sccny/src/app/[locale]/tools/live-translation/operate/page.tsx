"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@stackframe/stack";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TranslationOperator from "@/components/tools/TranslationOperator";
import TranslationViewer from "@/components/tools/TranslationViewer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
} from "dark-blue";

interface TranslationSession {
  id: string;
  title: string;
  status: string;
  language: string;
  startedAt: string;
  endedAt: string | null;
}

export default function TranslationOperatePage() {
  const t = useTranslations("LiveTranslation");
  const user = useUser();
  const [activeSession, setActiveSession] = useState<TranslationSession | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    try {
      const res = await fetch("/api/tools/translation/sessions?status=ACTIVE");
      if (res.ok) {
        const data = await res.json();
        if (data.data.length > 0) {
          setActiveSession(data.data[0]);
        } else {
          setActiveSession(null);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSession();
  }, [fetchActiveSession]);

  const handleCreateSession = useCallback(
    async (title: string, language: string) => {
      const res = await fetch("/api/tools/translation/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, language }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create session");
      }

      const session = await res.json();
      setActiveSession(session);
    },
    []
  );

  const handleEndSession = useCallback(async () => {
    if (!activeSession) return;

    const res = await fetch(
      `/api/tools/translation/sessions/${activeSession.id}`,
      {
        method: "PATCH",
      }
    );

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to end session");
    }

    setActiveSession(null);
  }, [activeSession]);

  if (!user) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Alert>
              <AlertTitle>{t("authRequired")}</AlertTitle>
              <AlertDescription>
                {t("authRequiredDescription")}
              </AlertDescription>
            </Alert>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t("operatorTitle")}
            </h1>
            <p className="text-muted-foreground">{t("operatorDescription")}</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Operator Panel */}
              <div>
                <TranslationOperator
                  session={activeSession}
                  onCreateSession={handleCreateSession}
                  onEndSession={handleEndSession}
                />
              </div>

              {/* Live Preview */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>{t("livePreview")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeSession ? (
                      <TranslationViewer
                        sessionId={activeSession.id}
                        fontSize={16}
                        maxHeight="50vh"
                      />
                    ) : (
                      <p className="text-muted-foreground text-center py-12">
                        {t("createSessionToPreview")}
                      </p>
                    )}
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
