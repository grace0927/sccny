import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { notFound } from "next/navigation";
import UserDetail from "@/components/admin/users/UserDetail";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("UserManagement");

  const stackUser = await stackServerApp.getUser(id);
  if (!stackUser) {
    notFound();
  }

  const member = await prisma.member.findUnique({
    where: { userId: id },
    select: { id: true, status: true, name: true },
  });

  const userRoles = await prisma.userRole.findMany({
    where: { userId: id },
    include: { role: { select: { id: true, name: true } } },
  });

  const allRoles = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const userData = {
    id: stackUser.id,
    displayName: stackUser.displayName,
    primaryEmail: stackUser.primaryEmail,
    createdAt: stackUser.signedUpAt ? stackUser.signedUpAt.toISOString() : null,
    member: member || null,
    roles: userRoles.map((ur) => ur.role),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t("userDetail")}: {stackUser.displayName || stackUser.primaryEmail}
      </h1>
      <UserDetail user={userData} allRoles={allRoles} />
    </div>
  );
}
