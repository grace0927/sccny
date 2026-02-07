"use client";

import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, Input, Button } from "dark-blue";

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
      `${window.location.pathname}/result?q=${encodeURIComponent(query)}`,
      "BibleSearchResult",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background flex flex-col items-center pt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <Card>
            <CardContent className="pt-8 md:pt-12 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {t("title")}
              </h1>
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
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
