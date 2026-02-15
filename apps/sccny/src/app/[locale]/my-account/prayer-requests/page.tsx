import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import PrayerRequests from "@/components/member-corner/PrayerRequests";

export default async function PrayerRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await stackServerApp.getUser();
  if (!user) return null;

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
  });

  // Only ACTIVE members can access prayer requests
  if (!member || member.status !== "ACTIVE") {
    redirect(`/${locale}/my-account`);
  }

  return <PrayerRequests />;
}
