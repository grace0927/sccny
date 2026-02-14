"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, Badge, Button } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useRouter } from "@/i18n/navigation";
import RoleFormDialog from "./RoleFormDialog";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  _count: { users: number; permissions: number };
}

interface RoleTableProps {
  roles: Role[];
}

export default function RoleTable({ roles }: RoleTableProps) {
  const t = useTranslations("RoleManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admin/roles/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      router.refresh();
    }
    setDeleteTarget(null);
  }

  return (
    <>
      {hasPermission("roles.create") && (
        <Button onClick={() => setShowCreateForm(true)}>
          {t("createRole")}
        </Button>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  {t("name")}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  {t("description")}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  {t("permissions")}
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                  {t("users")}
                </th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {role.name}
                      </span>
                      {role.isSystem && (
                        <Badge variant="subtle">{t("system")}</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {role.description}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {role._count.permissions}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {role._count.users}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("roles.edit") && (
                        <Link href={`/admin/roles/${role.id}`}>
                          <Button variant="outline" size="sm">
                            {t("edit")}
                          </Button>
                        </Link>
                      )}
                      {hasPermission("roles.delete") && !role.isSystem && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(role)}
                        >
                          {t("delete")}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("confirmDelete")}
        description={t("confirmDeleteDescription", {
          name: deleteTarget?.name || "",
        })}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
      />

      {showCreateForm && (
        <RoleFormDialog onClose={() => setShowCreateForm(false)} />
      )}
    </>
  );
}
