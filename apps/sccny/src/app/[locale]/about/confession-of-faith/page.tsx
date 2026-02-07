import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function ConfessionOfFaith() {
  const t = useTranslations("ConfessionOfFaith");

  const faithPoints = [
    { key: "point1" },
    { key: "point2" },
    { key: "point3" },
    { key: "point4" },
    { key: "point5" },
    { key: "point6" },
    { key: "point7" },
    { key: "point8" },
    { key: "point9" },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-12">
            {t("title")}
          </h1>

          {/* Introduction */}
          <div className="mb-12">
            <p className="text-lg text-foreground leading-relaxed font-medium">
              {t("introduction")}
            </p>
          </div>

          {/* Faith Points */}
          <div className="space-y-8">
            {faithPoints.map((point, index) => (
              <div
                key={point.key}
                className="bg-card rounded-lg shadow-lg p-8 border border-border"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-bold text-lg">
                      {index + 1}
                    </div>
                  </div>
                  <div className="ml-6 flex-1">
                    <p className="text-foreground leading-relaxed text-base">
                      {t(point.key)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
