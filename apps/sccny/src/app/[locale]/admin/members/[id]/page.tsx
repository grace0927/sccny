import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import MemberDetail from "@/components/admin/members/MemberDetail";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("MemberManagement");

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    notFound();
  }

  const serialized = {
    ...member,
    birthday: member.birthday?.toISOString() || null,
    baptismDate: member.baptismDate?.toISOString() || null,
    memberSince: member.memberSince?.toISOString() || null,
    approvedAt: member.approvedAt?.toISOString() || null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t("memberDetail")}: {member.name}
      </h1>
      <MemberDetail member={serialized} />
    </div>
  );
}
