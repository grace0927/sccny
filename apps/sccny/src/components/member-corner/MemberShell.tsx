"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  activeOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/my-account", labelKey: "dashboard" },
  { href: "/my-account/profile", labelKey: "profile" },
  { href: "/my-account/prayer-requests", labelKey: "prayerRequests", activeOnly: true },
  { href: "/my-account/community", labelKey: "community", activeOnly: true },
];

interface MemberShellProps {
  children: ReactNode;
  isActive: boolean;
}

export default function MemberShell({ children, isActive }: MemberShellProps) {
  const t = useTranslations("MemberCorner");
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => !item.activeOnly || isActive);

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {t("backToSite")}
          </Link>
        </div>

        {/* Mobile nav */}
        <nav className="flex gap-1 mb-6 overflow-x-auto pb-1 md:hidden">
          {visibleItems.map((item) => {
            const isExact = item.href === "/my-account";
            const active = isExact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Desktop: sidebar + content */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block w-44 shrink-0">
            <nav className="space-y-0.5 sticky top-8">
              {visibleItems.map((item) => {
                const isExact = item.href === "/my-account";
                const active = isExact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
