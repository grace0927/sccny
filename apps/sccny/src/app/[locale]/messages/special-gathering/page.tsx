import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SermonList from "@/components/sermons/SermonList";
import { SermonType } from "@/generated/prisma";

export default function SpecialGathering() {
  const t = useTranslations("SpecialGathering");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-4">
              {t("title", { defaultValue: "Special Gathering" })}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {t("description", {
                defaultValue:
                  "Listen to and watch our special gathering messages and retreat teachings.",
              })}
            </p>
          </div>

          <SermonList type={SermonType.RETREAT_MESSAGE} showFilters={true} />
        </div>
      </main>
      <Footer />
    </>
  );
}
