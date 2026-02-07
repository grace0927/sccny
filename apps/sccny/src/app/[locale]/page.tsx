import { useTranslations } from "next-intl";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Carousel from "@/components/Carousel";
import NewsList from "@/components/news/NewsList";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardTitle, CardFooter, Button } from "dark-blue";

export default function Home() {
  const t = useTranslations("Home");

  return (
    <>
      <Navigation />

      {/* Header Section with Church Info */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {t("churchName")}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-2">
              {t("churchBibleVerse")}
            </p>
            <div className="text-sm text-muted-foreground">
              <a
                href="https://www.google.com/maps/place/18+Moriches+Rd,+Lake+Grove,+NY+11755"
                className="hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                18 Moriches Rd, Lake Grove, NY 11755
              </a>
              <span className="mx-2">|</span>
              <span>{t("sundayWorship")}: 10:00 am - 12:30 pm</span>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen">
        <Carousel />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-xl overflow-hidden">
              <figure>
                <Image
                  src="https://www.scc-ny.org/wp-content/uploads/2012/04/sermonpic.jpg"
                  alt="Weekly Golden Verse"
                  width={300}
                  height={140}
                  unoptimized
                />
              </figure>
              <CardContent className="pt-4">
                <CardTitle>{t("weeklyGoldenVerse")}</CardTitle>
              </CardContent>
              <CardFooter className="justify-end">
                <Button asChild>
                  <Link href="/golden-verse">{t("learnMore")}</Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="shadow-xl overflow-hidden">
              <figure>
                <Image
                  src="https://www.scc-ny.org/wp-content/uploads/2015/08/CampusFellowship.jpg"
                  alt="Campus Fellowship"
                  width={300}
                  height={140}
                  unoptimized
                />
              </figure>
              <CardContent className="pt-4">
                <CardTitle>{t("campusFellowship")}</CardTitle>
              </CardContent>
              <CardFooter className="justify-end">
                <Button asChild>
                  <Link href="/ministries/campus-fellowship">
                    {t("learnMore")}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card className="shadow-xl overflow-hidden">
              <figure>
                <Image
                  src="https://www.scc-ny.org/wp-content/uploads/2012/09/seekingtruth.jpg"
                  alt="Seeking Truth"
                  width={300}
                  height={140}
                  unoptimized
                />
              </figure>
              <CardContent className="pt-4">
                <CardTitle>{t("seekingTruth")}</CardTitle>
              </CardContent>
              <CardFooter className="justify-end">
                <Button asChild>
                  <Link href="/lordsday-worship">{t("learnMore")}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Latest Sermon Section */}
          <div className="mt-16 bg-muted p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Latest Sermon
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  拆毁隔断的墙 – 黄克斌 - July 13, 2025
                </h3>
              </div>
              <div className="mt-4 md:mt-0">
                <Button asChild>
                  <a
                    href="http://www.scc-ny.org/wp-content/uploads/2025/07/拆毁隔断的墙-黄克斌.mp3"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Latest Sermon
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* News and Events Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Upcoming Events
                </h2>
                <Link
                  href="/events"
                  className="text-primary hover:text-primary/80"
                >
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  No upcoming events at this time.
                </p>
              </div>
            </div>

            {/* News & Announcements */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  News & Announcements
                </h2>
                <Link
                  href="/news"
                  className="text-primary hover:text-primary/80"
                >
                  Read All
                </Link>
              </div>
              <NewsList limit={3} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
