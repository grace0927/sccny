import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import SermonTable from "@/components/admin/sermons/SermonTable";

export default async function SermonsAdminPage() {
  const t = await getTranslations("SermonManagement");

  const [sermons, total] = await Promise.all([
    prisma.sermon.findMany({
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.sermon.count(),
  ]);

  const serialized = sermons.map((s) => ({
    ...s,
    date: s.date.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <SermonTable
        initialData={serialized}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
