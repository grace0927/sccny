import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import RoleTable from "@/components/admin/RoleTable";

export default async function RolesPage() {
  const t = await getTranslations("RoleManagement");

  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true, permissions: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      </div>
      <RoleTable roles={roles} />
    </div>
  );
}
