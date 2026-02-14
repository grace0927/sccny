"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@stackframe/stack";
import { Button } from "dark-blue";
import { Link } from "@/i18n/navigation";

interface AdminTopBarProps {
  onMenuToggle: () => void;
}

export default function AdminTopBar({ onMenuToggle }: AdminTopBarProps) {
  const t = useTranslations("Admin");
  const user = useUser();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; {t("backToSite")}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-muted-foreground">
            {user.displayName || user.primaryEmail}
          </span>
        )}
      </div>
    </header>
  );
}
