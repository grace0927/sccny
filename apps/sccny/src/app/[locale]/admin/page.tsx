import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "dark-blue";
import StatusBadge from "@/components/admin/StatusBadge";
import { format } from "date-fns";

export default async function AdminDashboard() {
  const t = await getTranslations("Admin");

  const [sermonCount, newsCount, memberCount, pendingMemberCount, recentLogs] = await Promise.all([
    prisma.sermon.count(),
    prisma.news.count(),
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.count({ where: { status: "PENDING" } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const stats = [
    { label: t("dashboard.sermons"), value: sermonCount },
    { label: t("dashboard.news"), value: newsCount },
    { label: t("dashboard.members"), value: memberCount },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t("dashboard.title")}
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending member requests notice */}
      {pendingMemberCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {pendingMemberCount} {t("dashboard.pendingRequests")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recentActivity")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.noActivity")}
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={log.action} />
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {log.userName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        {log.action.toLowerCase()} {log.resourceType}
                        {log.resourceId && ` #${log.resourceId.slice(0, 8)}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(log.createdAt, "MMM d, HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
