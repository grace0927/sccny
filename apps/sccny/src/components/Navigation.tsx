"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState } from "react";
import { Button, Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "dark-blue";

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
    <div className="flex items-center justify-between h-16 px-4 bg-card border-b border-border shadow-sm">
      <div className="flex-shrink-0">
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <Dropdown>
            <DropdownTrigger asChild>
              <Button
                variant="ghost"
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
              </Button>
            </DropdownTrigger>
            <DropdownContent className="w-52 z-[100]">
              {navigation.map((item) =>
                item.sublinks ? (
                  <div key={item.name}>
                    <DropdownItem className="font-semibold">
                      {t(item.name)}
                    </DropdownItem>
                    {item.sublinks.map((sublink) => (
                      <DropdownItem key={sublink.name}>
                        <Link href={sublink.href} className="pl-6 block w-full">
                          {t(sublink.name)}
                        </Link>
                      </DropdownItem>
                    ))}
                  </div>
                ) : (
                  <DropdownItem key={item.name}>
                    <Link href={item.href} className="block w-full">{t(item.name)}</Link>
                  </DropdownItem>
                )
              )}
            </DropdownContent>
          </Dropdown>
        </div>
      </div>

      <div className="max-lg:hidden lg:flex flex-1 justify-center">
        <ul className="flex items-center space-x-1">
          {navigation.map((item) => (
            <li key={item.name} className="group relative">
              {item.sublinks ? (
                <div className="relative">
                  <button className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary flex items-center">
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
                  <ul className="absolute -left-5 top-full mt-1 p-2 whitespace-nowrap min-w-[200px] z-[100] bg-card shadow-lg rounded-md border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200">
                    {item.sublinks.map((sublink) => (
                      <li key={sublink.name}>
                        <Link
                          href={sublink.href}
                          className="hover:bg-muted block px-2 py-1 rounded text-sm text-foreground"
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
                  className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary"
                >
                  {t(item.name)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-shrink-0">
        {/* Language dropdown */}
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost">{t("LANGUAGE")}</Button>
          </DropdownTrigger>
          <DropdownContent className="w-32 z-[100]">
            {languageOptions.map((option) => (
              <DropdownItem key={option.locale}>
                <Link locale={option.locale} href="/" className="block w-full">
                  {option.label}
                </Link>
              </DropdownItem>
            ))}
          </DropdownContent>
        </Dropdown>
      </div>
    </div>
  );
}
