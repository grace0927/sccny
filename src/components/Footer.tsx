import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Contact Information Section */}
          <div>
            <p className="text-xl font-bold mb-4">{t("churchName")}</p>
            <p className="text-gray-300 mb-2">
              18 Moriches Rd, Lake Grove, NY 11755
            </p>
            <p className="text-gray-300 mb-2">(631) 615-1470</p>
            <p className="text-gray-300 mb-2">{t("churchOfficeHours")}</p>
            <p className="text-gray-300">{t("callBeforeVisit")}</p>
          </div>
          {/* About Us Column */}
          <div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("aboutUs")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/confession-of-faith"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("confessionOfFaith")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/historic-creeds"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("historicCreeds")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/vision"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("ourVision")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Ministries Column */}
          <div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("ministries")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("prayerMeeting")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("familyFellowship")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("sisterFellowship")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("calebFellowship")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("truthPursuitClass")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("youthMinistry")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/about/ministries"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("childrenMinistry")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Sermons Column */}
          <div>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/messages"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("sermons")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/messages/sermon-recordings"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("sermonRecordings")}
                </Link>
              </li>
              <li className="ml-4">
                <Link
                  href="/messages/sunday-school"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("lordsDaySchool")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-600 mb-4" />

        {/* Copyright Section */}
        <div className="text-center text-gray-400 text-sm">
          <p>
            &copy; {new Date().getFullYear()} {t("churchName")}.{" "}
            {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
