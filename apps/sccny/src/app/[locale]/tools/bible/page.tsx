"use client";

import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function BiblePage() {
  const t = useTranslations("Tools.bible");
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Open new window with search result
    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      // We use relative path here, assuming the locale will be preserved or handled by the app structure
      // However, since window.open takes a URL, we should construct it carefully.
      // A safer bet is to rely on the current locale path.
      `${window.location.pathname}/result?q=${encodeURIComponent(query)}`,
      "BibleSearchResult",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 flex flex-col items-center pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t("title")}
            </h1>
            <p className="text-gray-600 mb-8">{t("description")}</p>

            <form onSubmit={handleSearch} className="w-full max-w-lg mx-auto">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  aria-label={t("searchButton")}
                >
                  <MagnifyingGlassIcon className="h-6 w-6" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
