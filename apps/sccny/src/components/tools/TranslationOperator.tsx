"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
} from "dark-blue";
import { cn } from "@/lib/utils";

interface TranslationSession {
  id: string;
  title: string;
  status: string;
  language: string;
  startedAt: string;
  endedAt: string | null;
}

interface TranslationOperatorProps {
  session: TranslationSession | null;
  onCreateSession: (title: string, language: string) => Promise<void>;
  onEndSession: () => Promise<void>;
  className?: string;
}

export default function TranslationOperator({
  session,
  onCreateSession,
  onEndSession,
  className,
}: TranslationOperatorProps) {
  const t = useTranslations("LiveTranslation");
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("zh");
  const [fontSize, setFontSize] = useState(18);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLanguage, setNewLanguage] = useState("zh");
  const [error, setError] = useState<string | null>(null);
  const [recentEntries, setRecentEntries] = useState<
    { id: string; text: string; language: string; createdAt: string }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(async () => {
    if (!text.trim() || !session) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/tools/translation/sessions/${session.id}/entries`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim(), language }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit entry");
      }

      const entry = await res.json();
      setRecentEntries((prev) => [...prev.slice(-4), entry]);
      setText("");
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }, [text, session, language]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim()) return;
    setIsCreating(true);
    setError(null);
    try {
      await onCreateSession(newTitle.trim(), newLanguage);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setIsCreating(false);
    }
  }, [newTitle, newLanguage, onCreateSession]);

  const handleEnd = useCallback(async () => {
    setIsEnding(true);
    setError(null);
    try {
      await onEndSession();
      setRecentEntries([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to end session");
    } finally {
      setIsEnding(false);
    }
  }, [onEndSession]);

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!session ? (
        /* Create Session Form */
        <Card>
          <CardHeader>
            <CardTitle>{t("createSession")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session-title">{t("sessionTitle")}</Label>
              <Input
                id="session-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t("sessionTitlePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="session-language">{t("defaultLanguage")}</Label>
              <Select
                id="session-language"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
              >
                <option value="zh">{t("chinese")}</option>
                <option value="en">{t("english")}</option>
              </Select>
            </div>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newTitle.trim()}
              className="w-full"
            >
              {isCreating ? t("creating") : t("startSession")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Session Info */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {session.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("startedAt")}:{" "}
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500">
                    {t("active")}
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEnd}
                    disabled={isEnding}
                  >
                    {isEnding ? t("ending") : t("endSession")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Input Controls */}
          <Card>
            <CardContent className="py-4 space-y-4">
              {/* Language and Font Size Controls */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="entry-language">{t("language")}</Label>
                  <Select
                    id="entry-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="zh">{t("chinese")}</option>
                    <option value="en">{t("english")}</option>
                  </Select>
                </div>
                <div>
                  <Label>{t("fontSize")}</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFontSize((s) => Math.max(12, s - 2))}
                    >
                      A-
                    </Button>
                    <span className="text-sm w-8 text-center">{fontSize}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFontSize((s) => Math.min(32, s + 2))}
                    >
                      A+
                    </Button>
                  </div>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <Label htmlFor="translation-text">{t("translationText")}</Label>
                <textarea
                  ref={textareaRef}
                  id="translation-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("textPlaceholder")}
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  style={{ fontSize: `${fontSize}px` }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t("pressEnterToSubmit")}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !text.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? t("submitting") : t("submit")}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t("recentEntries")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 bg-muted/50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.language === "zh" ? "CN" : "EN"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-foreground">{entry.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
