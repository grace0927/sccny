import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { BookOpenIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardFooter, Button } from "dark-blue";

export default function ToolsPage() {
  const t = useTranslations("Tools");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Bible Tool Card */}
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full mr-4">
                    <BookOpenIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t("bible.title")}
                  </h2>
                </div>
                <p className="text-muted-foreground mb-6">{t("bible.description")}</p>
              </CardContent>
              <CardFooter className="justify-end">
                <Button asChild>
                  <Link href="/tools/bible">{t("bible.searchButton")}</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Live Translation Card */}
            <Card className="hover:shadow-xl transition-shadow duration-300">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full mr-4">
                    <LanguageIcon className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t("liveTranslation.title")}
                  </h2>
                </div>
                <p className="text-muted-foreground mb-6">{t("liveTranslation.description")}</p>
              </CardContent>
              <CardFooter className="justify-end">
                <Button asChild>
                  <Link href="/tools/live-translation">{t("liveTranslation.openButton")}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
