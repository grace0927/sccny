"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

const LOCALE_KEY = "preferred-locale";
const VALID_LOCALES = ["en", "zh"];

export default function LocaleSync() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // On mount and locale changes: redirect to stored locale if it differs,
  // otherwise persist the current locale. Never write the old locale to
  // localStorage when a redirect is about to happen (that caused an
  // infinite zh→en→zh loop because both effects ran before navigation).
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && VALID_LOCALES.includes(stored) && stored !== locale) {
      router.replace(pathname, { locale: stored });
      return; // don't persist the locale we're redirecting away from
    }
    localStorage.setItem(LOCALE_KEY, locale);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return null;
}
