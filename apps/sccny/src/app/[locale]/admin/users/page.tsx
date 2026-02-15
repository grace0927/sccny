import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import UserTable from "@/components/admin/users/UserTable";

export default async function UsersPage() {
  const t = await getTranslations("UserManagement");

  const stackUsers = await stackServerApp.listUsers();

  const members = await prisma.member.findMany({
    select: { userId: true, status: true },
  });
  const memberMap = new Map(members.map((m) => [m.userId, m.status]));

  const userRoles = await prisma.userRole.findMany({
    include: { role: { select: { id: true, name: true } } },
  });
  const roleMap = new Map<string, { id: string; name: string }[]>();
  for (const ur of userRoles) {
    const existing = roleMap.get(ur.userId) || [];
    existing.push(ur.role);
    roleMap.set(ur.userId, existing);
  }

  const users = stackUsers.map((su) => ({
    id: su.id,
    displayName: su.displayName,
    primaryEmail: su.primaryEmail,
    createdAt: su.signedUpAt ? su.signedUpAt.toISOString() : null,
    memberStatus: memberMap.get(su.id) || null,
    roles: roleMap.get(su.id) || [],
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <UserTable
        initialData={users}
        initialPagination={{ page: 1, limit: 20, total: users.length, totalPages: Math.ceil(users.length / 20) }}
      />
    </div>
  );
}
