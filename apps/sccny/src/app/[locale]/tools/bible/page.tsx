"use client";

import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DocumentDuplicateIcon } = require("@heroicons/react/24/outline");
import {
  Card,
  CardContent,
  Input,
  Button,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
} from "dark-blue";
import axios from "axios";

// ── Types ────────────────────────────────────────────────────────────────────

interface VerseSegment {
  zhTitle: string;
  enTitle: string;
  zhVerses: string[];
  enVerses: string[];
}

interface SheetsApiResponse {
  status: string;
  results: VerseSegment[];
  error?: string;
}

// Legacy external-API types (fallback)
interface BibleVerse {
  chineses: string;
  engs: string;
  chap: number;
  sec: number;
  bible_text: string;
}

interface ExternalApiResponse {
  status: string;
  record_count: number;
  record: BibleVerse[];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BiblePage() {
  const t = useTranslations("Tools.bible");

  const [query, setQuery] = useState("");
  const [segments, setSegments] = useState<VerseSegment[]>([]);
  const [legacyVerses, setLegacyVerses] = useState<BibleVerse[]>([]);
  const [usingSheetsSource, setUsingSheetsSource] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchBibleVerse = useCallback(
    async (searchQuery: string) => {
      setLoading(true);
      setError("");
      setSearched(true);
      setSegments([]);
      setLegacyVerses([]);

      try {
        // Try Google Sheets source first (same data as PPT generation tool)
        const sheetsRes = await axios.get<SheetsApiResponse>(
          `/api/tools/bible/sheets-search?q=${encodeURIComponent(searchQuery)}`
        );

        if (sheetsRes.data.status === "success" && sheetsRes.data.results?.length > 0) {
          setSegments(sheetsRes.data.results);
          setUsingSheetsSource(true);
          return;
        }

        if (sheetsRes.data.status === "not_found") {
          setError(t("noResults"));
          return;
        }
      } catch {
        // Google Sheets unavailable — fall through to external API
      }

      // Fallback: external bible.fhl.net API
      try {
        const externalRes = await axios.get<ExternalApiResponse>(
          `/api/tools/bible/search?q=${encodeURIComponent(searchQuery)}&version=unv`
        );

        if (externalRes.data.status === "success" && externalRes.data.record?.length > 0) {
          setLegacyVerses(externalRes.data.record);
          setUsingSheetsSource(false);
        } else {
          setError(t("noResults"));
        }
      } catch {
        setError(t("fetchError"));
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  // fetchBibleVerse manages its own loading state via the try/finally in the
  // fallback branch; make sure loading is cleared even when sheets succeeds.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    fetchBibleVerse(query.trim()).finally(() => setLoading(false));
  };

  const handleCopySegment = async (seg: VerseSegment, index: number) => {
    const text = [
      `${seg.zhTitle}`,
      seg.zhVerses.join(" "),
      "",
      `${seg.enTitle}`,
      seg.enVerses.join(" "),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCopyLegacyVerse = async (verse: BibleVerse, index: number) => {
    const reference = `${verse.chineses || verse.engs} ${verse.chap}:${verse.sec}`;
    const text = `${verse.bible_text}\n-- ${reference}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const hasResults = segments.length > 0 || legacyVerses.length > 0;

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background flex flex-col items-center pt-24 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          {/* Search Card */}
          <Card>
            <CardContent className="pt-8 md:pt-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <BookOpenIcon className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">
                  {t("title")}
                </h1>
              </div>
              <p className="text-muted-foreground mb-8">{t("description")}</p>

              <form onSubmit={handleSearch} className="w-full max-w-lg mx-auto">
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="pr-12 py-3 text-lg"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="absolute right-2"
                    aria-label={t("searchButton")}
                    disabled={loading || !query.trim()}
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {t("searchHint")}
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Results Section */}
          {(loading || searched) && (
            <div className="mt-6">
              {/* Results Header */}
              {!loading && hasResults && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {t("resultTitle")}
                  </h2>
                  {usingSheetsSource && segments.length > 0 && (
                    <Badge variant="outline">
                      {segments.length}{" "}
                      {segments.length === 1 ? "passage" : "passages"}
                    </Badge>
                  )}
                  {!usingSheetsSource && legacyVerses.length > 0 && (
                    <Badge variant="outline">
                      {legacyVerses.length} {t("versesFound")}
                    </Badge>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <Card>
                  <CardContent className="py-8">
                    <div className="space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error State */}
              {!loading && error && (
                <Alert variant="destructive">
                  <AlertTitle>{t("errorTitle")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Google Sheets Results (parallel zh/en view) */}
              {!loading && !error && usingSheetsSource && segments.length > 0 && (
                <div className="space-y-4">
                  {segments.map((seg, index) => (
                    <Card
                      key={`${seg.zhTitle}-${index}`}
                      className="transition-all hover:shadow-md"
                    >
                      <CardContent className="py-5">
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="font-semibold">
                              {seg.zhTitle}
                            </Badge>
                            <Badge variant="subtle" className="text-muted-foreground font-normal">
                              {seg.enTitle}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopySegment(seg, index)}
                            aria-label={t("copyVerse")}
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            {copiedIndex === index && (
                              <span className="text-xs ml-1 text-green-600">
                                {t("copied")}
                              </span>
                            )}
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Chinese text */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                              {t("chineseLabel")}
                            </p>
                            <p className="text-foreground leading-relaxed text-sm">
                              {seg.zhVerses.join(" ")}
                            </p>
                          </div>

                          {/* English text */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                              {t("englishLabel")}
                            </p>
                            <p className="text-foreground leading-relaxed text-sm">
                              {seg.enVerses.join(" ")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Legacy External API Results */}
              {!loading && !error && !usingSheetsSource && legacyVerses.length > 0 && (
                <div className="space-y-3">
                  {legacyVerses.map((verse, index) => (
                    <Card
                      key={`${verse.chap}-${verse.sec}-${index}`}
                      className="transition-all hover:shadow-md"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono text-xs shrink-0">
                                {verse.chineses || verse.engs} {verse.chap}:{verse.sec}
                              </Badge>
                              {verse.engs && verse.chineses && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {verse.engs}
                                </span>
                              )}
                            </div>
                            <p className="text-foreground text-base leading-relaxed">
                              <span className="text-primary font-semibold mr-1">
                                {verse.sec}
                              </span>
                              {verse.bible_text}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyLegacyVerse(verse, index)}
                            aria-label={t("copyVerse")}
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            {copiedIndex === index && (
                              <span className="text-xs ml-1 text-green-600">
                                {t("copied")}
                              </span>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && !hasResults && searched && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">{t("noResults")}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
