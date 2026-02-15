"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "dark-blue";
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

export default function MemberDashboard({ member }: MemberDashboardProps) {
  const t = useTranslations("MemberCorner");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t("welcomeBack", { name: member.name })}
      </h1>

      <MemberStatusBanner status={member.status} rejectionReason={member.rejectionReason} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("profile")}</CardTitle>
              <Link href="/my-account/profile">
                <Button variant="outline" size="sm">{t("editProfile")}</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">{t("profileForm.name")}</span>
              <p className="text-sm font-medium text-foreground">
                {member.name}
                {member.nameZh && ` (${member.nameZh})`}
              </p>
            </div>
            {member.memberSince && (
              <p className="text-sm text-muted-foreground">
                {t("memberSince", { date: new Date(member.memberSince).toLocaleDateString() })}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Groups & Ministry (ACTIVE only) */}
        {member.status === "ACTIVE" && (
          <Card>
            <CardHeader>
              <CardTitle>{t("fellowshipGroup")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.fellowshipGroup ? (
                <Badge>{member.fellowshipGroup}</Badge>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}

              <div>
                <span className="text-sm text-muted-foreground">{t("ministryAssignments")}</span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {member.ministryAssignments.length > 0 ? (
                    member.ministryAssignments.map((m) => <Badge key={m} variant="subtle">{m}</Badge>)
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prayer Requests link (ACTIVE only) */}
      {member.status === "ACTIVE" && (
        <Link href="/my-account/prayer-requests">
          <Button variant="outline">{t("prayerRequests")}</Button>
        </Link>
      )}
    </div>
  );
}
