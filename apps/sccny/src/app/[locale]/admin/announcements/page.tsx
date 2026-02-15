import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import AnnouncementTable from "@/components/admin/announcements/AnnouncementTable";

export default async function AnnouncementsAdminPage() {
  const t = await getTranslations("AnnouncementManagement");

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.announcement.count(),
  ]);

  const serialized = announcements.map((a) => ({
    ...a,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <AnnouncementTable
        initialData={serialized}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
