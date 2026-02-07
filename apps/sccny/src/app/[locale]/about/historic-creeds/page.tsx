import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "dark-blue";

export default function HistoricCreeds() {
  const t = useTranslations("HistoricCreeds");

  const creeds = [
    {
      key: "apostlesCreed",
      link: "https://en.wikipedia.org/wiki/Apostles%27_Creed",
    },
    { key: "niceneCreed", link: "https://en.wikipedia.org/wiki/Nicene_Creed" },
    {
      key: "chalcedonianCreed",
      link: "https://en.wikipedia.org/wiki/Chalcedonian_Creed",
    },
    {
      key: "athanasianCreed",
      link: "https://en.wikipedia.org/wiki/Athanasian_Creed",
    },
    {
      key: "chicagoStatement",
      link: "https://www.bible-researcher.com/chicago1.html",
    },
    {
      key: "cambridgeDeclaration",
      link: "https://www.monergism.com/cambridge-declaration",
    },
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

          {/* Creeds and Statements List */}
          <div className="space-y-6">
            {creeds.map((creed, index) => (
              <div
                key={creed.key}
                className="bg-card rounded-lg shadow-lg p-6 border border-border hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full font-bold text-lg">
                        {index + 1}
                      </div>
                    </div>
                    <div className="ml-6">
                      <h3 className="text-xl font-semibold text-foreground">
                        {t(creed.key)}
                      </h3>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button asChild>
                      <a
                        href={creed.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>Learn More</span>
                        <svg
                          className="ml-2 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-muted rounded-lg p-8 border border-border">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                About These Statements
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                These historic creeds and declarations represent the
                foundational beliefs that have guided Christian faith throughout
                history. Suffolk Christian Church affirms these statements as
                expressions of biblical truth and orthodox Christian doctrine.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
