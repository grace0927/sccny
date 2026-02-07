import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PastoralSearch() {
  const t = useTranslations("PastoralSearch");

  return (
    <>
      <Navigation />
      <main className="min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl mb-12">
            {t("title")}
          </h1>

          {/* Education and Experience Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("educationAndExperience")}
            </h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("educationRequirement1")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("educationRequirement2")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("educationRequirement3")}</span>
              </li>
            </ul>
          </section>

          {/* Characters Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("characters")}
            </h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("charactersRequirement")}</span>
              </li>
            </ul>
          </section>

          {/* Skills Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("skills")}
            </h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("skillsRequirement1")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("skillsRequirement2")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("skillsRequirement3")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("skillsRequirement4")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("skillsRequirement5")}</span>
              </li>
            </ul>
          </section>

          {/* Duties and Responsibilities Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("dutiesAndResponsibilities")}
            </h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span className="font-semibold">{t("pastorYouth")}</span>
              </li>
              <li className="ml-6 space-y-2">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                    <span>{t("duty1")}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                    <span>{t("duty2")}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                    <span>{t("duty3")}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                    <span>{t("duty4")}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                    <span>{t("duty5")}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                    <span>{t("duty6")}</span>
                  </li>
                </ul>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("duty7")}</span>
              </li>
            </ul>
          </section>

          {/* Statements and Proclamations Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("statementsAndProclamations")}
            </h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("apostlesCreed")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("niceneCreed")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("chalcedonianCreed")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("athanasianCreed")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("chicagoStatement")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("cambridgeDeclaration")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("nashvilleStatement")}</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <span>{t("suffolkBylaws")}</span>
              </li>
            </ul>
          </section>

          {/* Contact Section */}
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              {t("contact")}
            </h2>
            <ul className="space-y-4 text-foreground">
              <li className="flex items-start">
                <span className="inline-block w-2 h-2 bg-muted-foreground rounded-full mt-2 mr-4 flex-shrink-0"></span>
                <a
                  href={`mailto:${t("contactEmail")}`}
                  className="text-primary hover:text-primary/80 underline"
                >
                  {t("contactEmail")}
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
