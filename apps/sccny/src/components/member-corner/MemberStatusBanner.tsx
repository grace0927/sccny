"use client";

import { useTranslations } from "next-intl";
import { Button } from "dark-blue";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

interface MemberStatusBannerProps {
  status: string;
  rejectionReason?: string | null;
}

export default function MemberStatusBanner({ status, rejectionReason }: MemberStatusBannerProps) {
  const t = useTranslations("MemberCorner");
  const router = useRouter();
  const [reapplying, setReapplying] = useState(false);

  async function handleReapply() {
    setReapplying(true);
    try {
      const res = await fetch("/api/member/me/reapply", { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setReapplying(false);
    }
  }

  if (status === "ACTIVE") return null;

  const bgColor =
    status === "REJECTED" ? "bg-destructive/10 border-destructive/20" :
    status === "INACTIVE" ? "bg-muted border-border" :
    "bg-primary/10 border-primary/20";

  const textColor =
    status === "REJECTED" ? "text-destructive" :
    status === "INACTIVE" ? "text-muted-foreground" :
    "text-primary";

  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <p className={`text-sm font-medium ${textColor}`}>
        {status === "PENDING" && t("pendingBanner")}
        {status === "REJECTED" && t("rejectedBanner")}
        {status === "INACTIVE" && t("inactiveBanner")}
      </p>
      {status === "REJECTED" && rejectionReason && (
        <p className="text-sm text-muted-foreground mt-1">
          {t("rejectedReason", { reason: rejectionReason })}
        </p>
      )}
      {status === "REJECTED" && (
        <Button
          size="sm"
          className="mt-2"
          onClick={handleReapply}
          disabled={reapplying}
        >
          {t("reapply")}
        </Button>
      )}
    </div>
  );
}
