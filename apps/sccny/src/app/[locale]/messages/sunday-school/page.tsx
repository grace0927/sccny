import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SermonList from "@/components/sermons/SermonList";
import { SermonType } from "@/generated/prisma";

export default function SundaySchool() {
  const t = useTranslations("SundaySchool");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-4">
              {t("title", { defaultValue: "Sunday School" })}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              {t("description", {
                defaultValue:
                  "Listen to and watch our Sunday school lessons and teachings.",
              })}
            </p>
          </div>

          <SermonList type={SermonType.SUNDAY_SCHOOL} showFilters={true} />
        </div>
      </main>
      <Footer />
    </>
  );
}
