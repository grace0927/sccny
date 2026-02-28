import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import CommunityFeed from "@/components/member-corner/CommunityFeed";
import { getTranslations } from "next-intl/server";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await stackServerApp.getUser();
  if (!user) return null;

  const member = await prisma.member.findUnique({ where: { userId: user.id } });

  if (!member || member.status !== "ACTIVE") {
    redirect(`/${locale}/my-account`);
  }

  const config = await prisma.systemConfig.findUnique({ where: { key: "post_max_length" } });
  const maxLength = config ? parseInt(config.value) : 150;

  const t = await getTranslations("Community");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <CommunityFeed currentMemberId={member.id} maxLength={maxLength} />
    </div>
  );
}
