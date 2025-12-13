"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
      // Using a proxy or direct call if CORS allows.
      // Based on typical browser limitations, calling http from https or cross-origin might fail.
      // However, the task description implies we can call it.
      // If CORS is an issue, we might need a Next.js API route proxy.
      // For now, let's try direct call, but typically we need an API route to avoid CORS.
      // I'll create an API route in a later step if this fails, or better yet,
      // I should probably implement a server-side proxy right away to be safe.
      // But let's follow the user's prompt closely "use a Chinese Bible API".
      // Given it's a "NEW separated window", it is still a client-side app.
      // Let's rely on a client call first, but I suspect CORS.
      // Just in case, I will add a fallback or note about CORS.
      // Actually, to ensure reliability, I will assume we might need a proxy if direct fail.
      // Let's try direct first as requested.

      // Update: User provided example: https://bible.fhl.net/json/qsb.php?qstr=%E5%BC%972:1
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
      // Fallback for CORS: suggesting user to use correct format or server error
      // In a real production app, we would definitely use a proxy.
      // I will implement a proxy if I can't check it now.
      // Actually, often these old PHP APIs don't have CORS headers.
      // I'll write a simple API route proxy in next step to guarantee it works.
      // But for this file, I'll point to an internal API route?
      // No, let's try direct first, if it fails I'll fix it.
      // WAIT, the prompt says "use a Chinese Bible API".
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("resultTitle")}: <span className="text-blue-600">{query}</span>
          </h1>
        </header>

        {loading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <div className="space-y-4">
            {results.map((verse, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-baseline mb-2">
                  <span className="font-bold text-lg text-gray-800 mr-2">
                    {verse.chineses} {verse.chap}:{verse.sec}
                  </span>
                  {/* <span className="text-sm text-gray-500">({verse.engs})</span> */}
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {verse.bible_text}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
           <div className="text-center py-12 text-gray-500">
             No verses found.
           </div>
        )}
      </div>
    </div>
  );
}
