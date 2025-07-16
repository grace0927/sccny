import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="footer p-10 bg-base-200 text-base-content">
      <nav>
        <h6 className="footer-title">{t("aboutUs")}</h6>
        <Link href="/about/confession-of-faith" className="link link-hover">
          {t("confessionOfFaith")}
        </Link>
        <Link href="/about/historic-creeds" className="link link-hover">
          {t("historicCreeds")}
        </Link>
        <Link href="/about/vision" className="link link-hover">
          {t("ourVision")}
        </Link>
        <Link href="/about/contact-us" className="link link-hover">
          {t("contactUs")}
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title">{t("ministries")}</h6>
        <Link href="/ministries/prayer-meeting" className="link link-hover">
          {t("prayerMeeting")}
        </Link>
        <Link href="/ministries/bible-study" className="link link-hover">
          {t("familyFellowship")}
        </Link>
        <Link href="/ministries/sister-bible-study" className="link link-hover">
          {t("sisterFellowship")}
        </Link>
        <Link href="/ministries/senior-ministry" className="link link-hover">
          {t("calebFellowship")}
        </Link>
        <Link
          href="/ministries/new-believers-class"
          className="link link-hover"
        >
          {t("truthPursuitClass")}
        </Link>
        <Link href="/ministries/youth-ministry" className="link link-hover">
          {t("youthMinistry")}
        </Link>
        <Link href="/ministries/children-ministry" className="link link-hover">
          {t("childrenMinistry")}
        </Link>
      </nav>
      <nav>
        <h6 className="footer-title">{t("sermons")}</h6>
        <Link href="/messages/sermon-recordings" className="link link-hover">
          {t("sermonRecordings")}
        </Link>
        <Link href="/messages/sunday-school" className="link link-hover">
          {t("lordsDaySchool")}
        </Link>
      </nav>
      <aside>
        <p>{t("churchName")}</p>
        <p>18 Moriches Rd, Lake Grove, NY 11755</p>
        <p>(631) 615-1470</p>
        <p>{t("churchOfficeHours")}</p>
        <p>{t("callBeforeVisit")}</p>
        <p>
          &copy; {new Date().getFullYear()} {t("churchName")}.{" "}
          {t("allRightsReserved")}
        </p>
      </aside>
    </footer>
  );
}
