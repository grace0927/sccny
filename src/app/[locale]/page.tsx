import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Carousel from "@/components/Carousel";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <>
      <Navigation />

      {/* Header Section with Church Info */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              施福基督教会 Suffolk Christian Church
            </h1>
            <p className="text-sm md:text-base text-gray-600 mb-2">
              耶稣说：『我就是道路、真理、生命，若不藉着我，没有人能到父那里去』—
              约翰福音14：6
            </p>
            <div className="text-sm text-gray-500">
              <a
                href="https://www.google.com/maps/place/18+Moriches+Rd,+Lake+Grove,+NY+11755"
                className="hover:text-blue-600"
                target="_blank"
                rel="noopener noreferrer"
              >
                18 Moriches Rd, Lake Grove, NY 11755
              </a>
              <span className="mx-2">|</span>
              <span>主日崇拜 Sunday Worship：10:00 am － 12:30 pm</span>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen">
        <Carousel />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl">
              <figure>
                <Image
                  src="https://www.scc-ny.org/wp-content/uploads/2012/04/sermonpic.jpg"
                  alt="Weekly Golden Verse"
                  width={300}
                  height={140}
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title">{t("weeklyGoldenVerse")}</h2>
                <div className="card-actions justify-end">
                  <Link href="/golden-verse" className="btn btn-primary">
                    {t("learnMore")}
                  </Link>
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <figure>
                <Image
                  src="https://www.scc-ny.org/wp-content/uploads/2015/08/CampusFellowship.jpg"
                  alt="Campus Fellowship"
                  width={300}
                  height={140}
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title">{t("campusFellowship")}</h2>
                <div className="card-actions justify-end">
                  <Link
                    href="/ministries/campus-fellowship"
                    className="btn btn-primary"
                  >
                    {t("learnMore")}
                  </Link>
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <figure>
                <Image
                  src="https://www.scc-ny.org/wp-content/uploads/2012/09/seekingtruth.jpg"
                  alt="Seeking Truth"
                  width={300}
                  height={140}
                />
              </figure>
              <div className="card-body">
                <h2 className="card-title">{t("seekingTruth")}</h2>
                <div className="card-actions justify-end">
                  <Link href="/lordsday-worship" className="btn btn-primary">
                    {t("learnMore")}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Latest Sermon Section */}
          <div className="mt-16 bg-gray-100 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Latest Sermon
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  拆毁隔断的墙 – 黄克斌 - July 13, 2025
                </h3>
              </div>
              <div className="mt-4 md:mt-0">
                <a
                  href="http://www.scc-ny.org/wp-content/uploads/2025/07/拆毁隔断的墙-黄克斌.mp3"
                  className="btn btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Latest Sermon
                </a>
              </div>
            </div>
          </div>

          {/* News and Events Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Upcoming Events
                </h2>
                <Link
                  href="/events"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <p className="text-gray-600">
                  No upcoming events at this time.
                </p>
              </div>
            </div>

            {/* News & Announcements */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  News & Announcements
                </h2>
                <Link
                  href="/news"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Read All
                </Link>
              </div>
              <div className="space-y-6">
                <article className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    施福教会2025年春季特会
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    posted on April 10, 2025
                  </p>
                  <Link
                    href="/news/spring-conference-2025"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Read More
                  </Link>
                </article>

                <article className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    2025-02-09 仅有线上聚会 Online Service only on Feb. 9th 2025
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    posted on February 8, 2025
                  </p>
                  <Link
                    href="/news/online-service-feb-9"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Read More
                  </Link>
                </article>

                <article className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    2024 康来昌牧师特会: 信耶稣的意义
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    posted on October 13, 2024
                  </p>
                  <Link
                    href="/news/pastor-kang-conference-2024"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Read More
                  </Link>
                </article>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
