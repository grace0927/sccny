"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Skeleton, Alert, AlertTitle, AlertDescription } from "dark-blue";

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

export default function BibleResultPage() {
  const t = useTranslations("Tools.bible");
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [results, setResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query) {
      fetchBibleVerse(query);
    }
  }, [query]);

  const fetchBibleVerse = async (searchQuery: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get<BibleApiResponse>(
        `https://bible.fhl.net/json/qsb.php?qstr=${encodeURIComponent(
          searchQuery
        )}`
      );

      if (response.data.status === "success") {
        setResults(response.data.record);
      } else {
        setError("No results found or API error.");
      }
    } catch (err) {
      console.error("Bible API Error:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-card p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-foreground">
            {t("resultTitle")}: <span className="text-primary">{query}</span>
          </h1>
        </header>

        {loading && (
          <div className="space-y-4 py-12">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-6 w-3/4 mt-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {results.map((verse, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                <div className="flex items-baseline mb-2">
                  <span className="font-bold text-lg text-foreground mr-2">
                    {verse.chineses} {verse.chap}:{verse.sec}
                  </span>
                </div>
                <p className="text-foreground text-lg leading-relaxed">
                  {verse.bible_text}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
           <div className="text-center py-12 text-muted-foreground">
             No verses found.
           </div>
        )}
      </div>
    </div>
  );
}
