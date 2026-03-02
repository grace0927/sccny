"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button } from "dark-blue";
import MemberStatusBanner from "./MemberStatusBanner";

interface MemberData {
  id: string;
  name: string;
  nameZh: string | null;
  status: string;
  rejectionReason: string | null;
  fellowshipGroup: string | null;
  ministryAssignments: string[];
  memberSince: string | null;
}

interface MemberDashboardProps {
  member: MemberData;
}

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  ACTIVE: "success",
  PENDING: "warning",
  REJECTED: "destructive",
  INACTIVE: "outline",
};

export default function MemberDashboard({ member }: MemberDashboardProps) {
  const t = useTranslations("MemberCorner");
  const badgeVariant = STATUS_BADGE[member.status] ?? "outline";

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("welcomeBack", { name: member.name })}
          </h1>
          {member.nameZh && (
            <p className="text-sm text-muted-foreground mt-0.5">{member.nameZh}</p>
          )}
        </div>
        <Badge variant={badgeVariant} className="shrink-0 mt-1">
          {member.status}
        </Badge>
      </div>

      <MemberStatusBanner status={member.status} rejectionReason={member.rejectionReason} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("profile")}</CardTitle>
              <Link href="/my-account/profile">
                <Button variant="ghost" size="sm">{t("editProfile")}</Button>
              </Link>
            </div>
            {member.memberSince && (
              <CardDescription>
                {t("memberSince", { date: new Date(member.memberSince).toLocaleDateString() })}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{t("profileForm.name")}</p>
              <p className="text-sm font-medium text-foreground">
                {member.name}
                {member.nameZh && (
                  <span className="text-muted-foreground font-normal"> ({member.nameZh})</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Groups & Ministry (ACTIVE only) */}
        {member.status === "ACTIVE" && (
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>{t("fellowshipGroup")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">{t("fellowshipGroup")}</p>
                {member.fellowshipGroup ? (
                  <Badge variant="subtle">{member.fellowshipGroup}</Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">{t("ministryAssignments")}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {member.ministryAssignments.length > 0 ? (
                    member.ministryAssignments.map((m) => (
                      <Badge key={m} variant="outline">{m}</Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ACTIVE-only quick action cards */}
      {member.status === "ACTIVE" && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {t("quickActions")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/my-account/prayer-requests" className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-5 pb-5">
                  <p className="text-sm font-semibold text-foreground">{t("prayerRequests")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("prayerRequestsDesc")}</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/my-account/community" className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="pt-5 pb-5">
                  <p className="text-sm font-semibold text-foreground">{t("community")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("communityDesc")}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
