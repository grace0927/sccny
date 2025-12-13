import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { BookOpenIcon } from "@heroicons/react/24/outline";

export default function ToolsPage() {
  const t = useTranslations("Tools");

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {t("title")}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Bible Tool Card */}
            <Link
              href="/tools/bible"
              className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 cursor-pointer"
            >
              <div className="card-body">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-blue-100 rounded-full mr-4">
                    <BookOpenIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h2 className="card-title text-xl font-bold text-gray-800">
                    {t("bible.title")}
                  </h2>
                </div>
                <p className="text-gray-600 mb-6">{t("bible.description")}</p>
                <div className="card-actions justify-end">
                  <div className="btn btn-primary">{t("bible.searchButton")}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
