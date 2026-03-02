import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";
import { prisma } from "@/lib/db";
import MemberShell from "@/components/member-corner/MemberShell";

export default async function MyAccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect(`/handler/sign-in?after_auth_return_to=/${locale}/my-account`);
  }

  const member = await prisma.member.findUnique({
    where: { userId: user.id },
    select: { status: true },
  });

  const isActive = member?.status === "ACTIVE";

  return <MemberShell isActive={isActive}>{children}</MemberShell>;
}
