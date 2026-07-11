import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import HymnTable from "@/components/admin/hymns/HymnTable";

export default async function HymnsAdminPage() {
  const t = await getTranslations("HymnManagement");

  const [hymns, total] = await Promise.all([
    prisma.hymn.findMany({
      orderBy: { number: "asc" },
      take: 20,
      select: {
        id: true,
        number: true,
        titleEn: true,
        titleZh: true,
        lyricsEn: true,
        lyricsZh: true,
        author: true,
        composer: true,
        category: true,
        slidesUrl: true,
        slideStartIndex: true,
        slideEndIndex: true,
      },
    }),
    prisma.hymn.count(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <HymnTable
        initialData={hymns}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
