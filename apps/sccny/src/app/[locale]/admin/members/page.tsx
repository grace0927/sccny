import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import MemberTable from "@/components/admin/members/MemberTable";

export default async function MembersPage() {
  const t = await getTranslations("MemberManagement");

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.member.count(),
  ]);

  const serialized = members.map((m) => ({
    ...m,
    birthday: m.birthday?.toISOString() || null,
    baptismDate: m.baptismDate?.toISOString() || null,
    memberSince: m.memberSince?.toISOString() || null,
    approvedAt: m.approvedAt?.toISOString() || null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <MemberTable
        initialData={serialized}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
