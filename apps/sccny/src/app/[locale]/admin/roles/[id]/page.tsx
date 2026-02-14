import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import RoleDetail from "@/components/admin/RoleDetail";

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("RoleManagement");

  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: { permission: true },
      },
      users: true,
    },
  });

  if (!role) {
    notFound();
  }

  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">
        {t("editRole")}: {role.name}
      </h1>
      <RoleDetail role={role} allPermissions={allPermissions} />
    </div>
  );
}
