"use client";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
  { name: "PASTORAL SEARCH", href: "/pastoral-search" },
  { name: "CONTACT US", href: "/contact" },
];

export default function Navigation() {
  const t = useTranslations("Navigation");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="navbar bg-base-100 shadow-md">
      <div className="navbar-start">
        <div className="dropdown">
          <label
            tabIndex={0}
            className="btn btn-ghost lg:hidden"
            onClick={() => setIsOpen(!isOpen)}
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
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </label>
          {isOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              {navigation.map((item) => (
                <li key={item.name}>
                  {item.sublinks ? (
                    <div className="dropdown dropdown-hover">
                      <label tabIndex={0} className="m-1">
                        {t(item.name)}
                      </label>
                      <ul
                        tabIndex={0}
                        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                      >
                        {item.sublinks.map((sublink) => (
                          <li key={sublink.name}>
                            <Link href={sublink.href}>{t(sublink.name)}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <Link href={item.href}>{t(item.name)}</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          SCC
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navigation.map((item) => (
            <li key={item.name}>
              {item.sublinks ? (
                <div className="dropdown dropdown-hover">
                  <label tabIndex={0} className="m-1">
                    {t(item.name)}
                  </label>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                  >
                    {item.sublinks.map((sublink) => (
                      <li key={sublink.name}>
                        <Link href={sublink.href}>{t(sublink.name)}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link href={item.href}>{t(item.name)}</Link>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <label tabIndex={0} className="btn btn-ghost m-1">
            {t("LANGUAGE")}
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
          >
            <li>
              <Link href="/en">English</Link>
            </li>
            <li>
              <Link href="/zh">中文</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
