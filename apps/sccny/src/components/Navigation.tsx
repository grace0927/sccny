"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";

const navigation = [
  { name: "HOME", href: "/" },
  {
    name: "ABOUT US",
    href: "/about",
    sublinks: [
      { name: "CONFESSION OF FAITH", href: "/about/confession-of-faith" },
      { name: "HISTORIC CREEDS", href: "/about/historic-creeds" },
      { name: "OUR VISION", href: "/about/vision" },
      { name: "MINISTRIES", href: "/about/ministries" },
    ],
  },
  { name: "MEETING TIMES", href: "/meeting-times" },
  {
    name: "MESSAGES",
    href: "/messages",
    sublinks: [
      { name: "SERMON RECORDINGS", href: "/messages/sermon-recordings" },
      { name: "SUNDAY SCHOOL", href: "/messages/sunday-school" },
      { name: "SPECIAL GATHERING", href: "/messages/special-gathering" },
      { name: "BAPTISM CLASS", href: "/messages/baptism-class" },
    ],
  },
  { name: "NEWS", href: "/news" },
  { name: "PASTORAL SEARCH", href: "/pastoral-search" },
  { name: "CONTACT US", href: "/contact" },
];

const languageOptions = [
  { locale: "en", label: "English" },
  { locale: "zh", label: "中文" },
];

export default function Navigation() {
  const t = useTranslations("Navigation");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="navbar bg-base-100 shadow-sm">
      <div className="navbar-start">
        {/* Mobile menu button */}
        <div className="dropdown">
          <label
            tabIndex={0}
            className="btn btn-ghost lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
          {mobileMenuOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[100] p-2 shadow bg-base-100 rounded-box w-52 whitespace-nowrap"
            >
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.sublinks ? (
                    <details className="z-[100]">
                      <summary>{t(item.name)}</summary>
                      <ul className="p-2 whitespace-nowrap min-w-[200px] z-[100]">
                        {item.sublinks.map((sublink) => (
                          <li key={sublink.name}>
                            <Link href={sublink.href}>{t(sublink.name)}</Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <Link href={item.href}>{t(item.name)}</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navigation.map((item) => (
            <li key={item.name} className="group">
              {item.sublinks ? (
                <div className="relative">
                  <button className="hover:bg-transparent hover:text-primary flex items-center">
                    {t(item.name)}
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  <ul className="absolute -left-5 top-[24px] mt-1 p-2 whitespace-nowrap min-w-[200px] z-[100] bg-base-100 shadow-lg rounded-box opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                    {item.sublinks.map((sublink) => (
                      <li key={sublink.name}>
                        <Link
                          href={sublink.href}
                          className="hover:bg-base-200 block px-2 py-1 rounded"
                        >
                          {t(sublink.name)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className="hover:bg-transparent hover:text-primary"
                >
                  {t(item.name)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-end">
        {/* Language dropdown */}
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost m-1">
            {t("LANGUAGE")}
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[100] menu p-2 shadow bg-base-100 rounded-box w-52 whitespace-nowrap"
          >
            {languageOptions.map((option) => (
              <li key={option.locale}>
                <Link locale={option.locale} href="/">
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
