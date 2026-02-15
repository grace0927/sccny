import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import ContentPageTable from "@/components/admin/content/ContentPageTable";

export default async function ContentAdminPage() {
  const t = await getTranslations("ContentManagement");

  const [pages, total] = await Promise.all([
    prisma.contentPage.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.contentPage.count(),
  ]);

  const serialized = pages.map((p) => ({
    ...p,
    publishedAt: p.publishedAt?.toISOString() || null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <ContentPageTable
        initialData={serialized}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
