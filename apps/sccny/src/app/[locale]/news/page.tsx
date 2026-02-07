import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import NewsList from "@/components/news/NewsList";

export default function NewsPage() {
  const t = useTranslations("News");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-4">
              {t("title", { defaultValue: "News & Announcements" })}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {t("description", {
                defaultValue:
                  "Stay updated with the latest news and announcements from our church community.",
              })}
            </p>
          </div>

          <NewsList showFilters={false} />
        </div>
      </main>
      <Footer />
    </>
  );
}
