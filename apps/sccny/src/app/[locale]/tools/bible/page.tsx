"use client";

import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
  Input,
  Button,
  Select,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
} from "dark-blue";
import axios from "axios";

interface BibleVerse {
  chineses: string;
  engs: string;
  chap: number;
  sec: number;
  bible_text: string;
}

interface BibleApiResponse {
  status: string;
  record_count: number;
  proc: number;
  record: BibleVerse[];
}

type BibleVersion = "unv" | "esv";

export default function BiblePage() {
  const t = useTranslations("Tools.bible");
  const [query, setQuery] = useState("");
  const [version, setVersion] = useState<BibleVersion>("unv");
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchBibleVerse = useCallback(
    async (searchQuery: string, selectedVersion: BibleVersion) => {
      setLoading(true);
      setError("");
      setSearched(true);
      try {
        const response = await axios.get<BibleApiResponse>(
          `/api/tools/bible/search?q=${encodeURIComponent(searchQuery)}&version=${selectedVersion}`
        );

        if (
          response.data.status === "success" &&
          response.data.record?.length > 0
        ) {
          setResults(response.data.record);
        } else {
          setResults([]);
          setError(t("noResults"));
        }
      } catch (err) {
        console.error("Bible API Error:", err);
        setError(t("fetchError"));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchBibleVerse(query.trim(), version);
  };

  const handleCopyVerse = async (verse: BibleVerse, index: number) => {
    const reference = `${verse.chineses || verse.engs} ${verse.chap}:${verse.sec}`;
    const text = `${verse.bible_text}\n-- ${reference}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback: ignore clipboard errors
    }
  };

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
                {/* Version Selector */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <label
                    htmlFor="bible-version"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {t("version")}:
                  </label>
                  <Select
                    id="bible-version"
                    value={version}
                    onChange={(e) =>
                      setVersion(e.target.value as BibleVersion)
                    }
                    className="w-[200px]"
                  >
                    <option value="unv">{t("versionCUV")}</option>
                    <option value="esv">{t("versionESV")}</option>
                  </Select>
                </div>

                {/* Search Input */}
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
              {!loading && results.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {t("resultTitle")}
                  </h2>
                  <Badge variant="secondary">
                    {results.length} {t("versesFound")}
                  </Badge>
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

              {/* Verse Results */}
              {!loading && !error && results.length > 0 && (
                <div className="space-y-3">
                  {results.map((verse, index) => (
                    <Card
                      key={`${verse.chap}-${verse.sec}-${index}`}
                      className="transition-all hover:shadow-md"
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Verse Reference */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-mono text-xs shrink-0">
                                {verse.chineses || verse.engs} {verse.chap}:
                                {verse.sec}
                              </Badge>
                              {verse.engs && verse.chineses && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {verse.engs}
                                </span>
                              )}
                            </div>

                            {/* Verse Text */}
                            <p className="text-foreground text-base leading-relaxed">
                              <span className="text-primary font-semibold mr-1">
                                {verse.sec}
                              </span>
                              {verse.bible_text}
                            </p>
                          </div>

                          {/* Copy Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() => handleCopyVerse(verse, index)}
                            aria-label={t("copyVerse")}
                          >
                            <ClipboardDocumentIcon className="h-4 w-4" />
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

              {/* Empty State (searched but no results and no error) */}
              {!loading && !error && results.length === 0 && searched && (
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
