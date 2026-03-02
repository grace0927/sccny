"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertContent, AlertTitle, AlertDescription, AlertActions, Button } from "dark-blue";
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

  const variant =
    status === "REJECTED" ? "destructive" :
    status === "INACTIVE" ? "warning" :
    "info";

  const title =
    status === "PENDING" ? t("pendingBanner") :
    status === "REJECTED" ? t("rejectedBanner") :
    t("inactiveBanner");

  return (
    <Alert variant={variant}>
      <AlertContent>
        <AlertTitle>{title}</AlertTitle>
        {status === "REJECTED" && rejectionReason && (
          <AlertDescription>{t("rejectedReason", { reason: rejectionReason })}</AlertDescription>
        )}
      </AlertContent>
      {status === "REJECTED" && (
        <AlertActions>
          <Button size="sm" onClick={handleReapply} disabled={reapplying}>
            {t("reapply")}
          </Button>
        </AlertActions>
      )}
    </Alert>
  );
}
