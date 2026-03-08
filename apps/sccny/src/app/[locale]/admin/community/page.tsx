import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import AdminCommunityTable from "@/components/admin/community/AdminCommunityTable";

export default async function AdminCommunityPage() {
  const t = await getTranslations("AdminCommunity");

  const [posts, total] = await Promise.all([
    prisma.communityPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        member: { select: { id: true, name: true, nameZh: true, email: true } },
      },
    }),
    prisma.communityPost.count(),
  ]);

  const serialized = posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <AdminCommunityTable
        initialData={serialized}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
