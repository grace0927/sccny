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

  // On first mount: redirect to stored locale if it differs from current
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && VALID_LOCALES.includes(stored) && stored !== locale) {
      router.replace(pathname, { locale: stored });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever the active locale changes, persist it
  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  return null;
}
