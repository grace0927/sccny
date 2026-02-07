import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-card border-t border-border">
      <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between">
          {/* Church Info Section */}
          <div className="mb-6 md:mb-0">
            <Link href="/" className="flex items-center">
              <span className="self-center text-2xl font-semibold whitespace-nowrap text-foreground">
                SCC
              </span>
            </Link>
            <div className="mt-4 text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">
                {t("churchName")}
              </p>
              <p className="mb-2">18 Moriches Rd, Lake Grove, NY 11755</p>
              <p className="mb-2">(631) 615-1470</p>
              <p className="mb-2">{t("churchOfficeHours")}</p>
              <p>{t("callBeforeVisit")}</p>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
            {/* About Us Section */}
            <div>
              <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">
                {t("aboutUs")}
              </h2>
              <ul className="text-muted-foreground font-medium">
                <li className="mb-4">
                  <Link
                    href="/about/confession-of-faith"
                    className="hover:underline hover:text-foreground"
                  >
                    {t("confessionOfFaith")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    href="/about/historic-creeds"
                    className="hover:underline hover:text-foreground"
                  >
                    {t("historicCreeds")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/about/vision" className="hover:underline hover:text-foreground">
                    {t("ourVision")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:underline hover:text-foreground">
                    {t("contactUs")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Ministries Section */}
            <div>
              <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">
                {t("ministries")}
              </h2>
              <ul className="text-muted-foreground font-medium">
                <li className="mb-4">
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("prayerMeeting")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("familyFellowship")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("sisterFellowship")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("calebFellowship")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("truthPursuitClass")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("youthMinistry")}
                  </Link>
                </li>
                <li>
                  <Link href="/about/ministries" className="hover:underline hover:text-foreground">
                    {t("childrenMinistry")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Messages Section */}
            <div>
              <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">
                {t("sermons")}
              </h2>
              <ul className="text-muted-foreground font-medium">
                <li className="mb-4">
                  <Link
                    href="/messages/sermon-recordings"
                    className="hover:underline hover:text-foreground"
                  >
                    {t("sermonRecordings")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    href="/messages/sunday-school"
                    className="hover:underline hover:text-foreground"
                  >
                    {t("lordsDaySchool")}
                  </Link>
                </li>
                <li className="mb-4">
                  <Link
                    href="/messages/special-gathering"
                    className="hover:underline hover:text-foreground"
                  >
                    {t("specialGathering")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages/baptism-class"
                    className="hover:underline hover:text-foreground"
                  >
                    {t("baptismClass")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <hr className="my-6 border-border sm:mx-auto lg:my-8" />

        {/* Copyright and Social Media */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground sm:text-center">
            © {new Date().getFullYear()}{" "}
            <Link href="/" className="hover:underline">
              {t("churchName")}
            </Link>
            . {t("allRightsReserved")}
          </span>
          <div className="flex mt-4 sm:justify-center sm:mt-0">
            {/* Facebook */}
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              <svg
                className="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 8 19"
              >
                <path
                  fillRule="evenodd"
                  d="M6.135 3H8V0H6.135a4.147 4.147 0 0 0-4.142 4.142V6H0v3h2v9.938h3V9h2.021l.592-3H5V3.591A.6.6 0 0 1 5.592 3h.543Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">Facebook page</span>
            </Link>
            {/* YouTube */}
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground ms-5"
            >
              <svg
                className="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 14"
              >
                <path
                  fillRule="evenodd"
                  d="M19.7 3.037a4.26 4.26 0 0 0-.789-1.964 2.84 2.84 0 0 0-1.984-.839c-2.767-.2-6.926-.2-6.926-.2s-4.157 0-6.928.2a2.836 2.836 0 0 0-1.983.839A4.225 4.225 0 0 0 .3 3.037a30.148 30.148 0 0 0-.2 3.206v1.5a30.12 30.12 0 0 0 .2 3.206c.094.712.364 1.39.784 1.972.604.536 1.38.837 2.187.848 1.583.151 6.731.2 6.731.2s4.161 0 6.928-.2a2.844 2.844 0 0 0 1.985-.84 4.27 4.27 0 0 0 .787-1.965 30.12 30.12 0 0 0 .2-3.206v-1.516a30.672 30.672 0 0 0-.202-3.206Zm-11.692 6.554v-5.62l5.4 2.819-5.4 2.801Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="sr-only">YouTube channel</span>
            </Link>
            {/* Email */}
            <Link
              href="mailto:info@sccny.org"
              className="text-muted-foreground hover:text-foreground ms-5"
            >
              <svg
                className="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 20 16"
              >
                <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
              </svg>
              <span className="sr-only">Email</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
