"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import PermissionMatrix from "./PermissionMatrix";

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: { permissionId: string; permission: Permission }[];
  users: { id: string; userId: string; assignedAt: Date }[];
}

interface RoleDetailProps {
  role: Role;
  allPermissions: Permission[];
}

export default function RoleDetail({ role, allPermissions }: RoleDetailProps) {
  const t = useTranslations("RoleManagement");
  const router = useRouter();
  const { hasPermission } = usePermissions();

  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(
    new Set(role.permissions.map((rp) => rp.permissionId))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveDetails() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update role");
    }
    setSaving(false);
    router.refresh();
  }

  async function handleSavePermissions() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/admin/roles/${role.id}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        permissionIds: Array.from(selectedPermissionIds),
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update permissions");
    }
    setSaving(false);
    router.refresh();
  }

  function togglePermission(permId: string) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  }

  const canEdit = hasPermission("roles.edit");

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Role details */}
      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="role-name">{t("name")}</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <Label htmlFor="role-desc">{t("description")}</Label>
            <Input
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          {canEdit && (
            <Button onClick={handleSaveDetails} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Permission matrix */}
      <Card>
        <CardHeader>
          <CardTitle>{t("permissionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionMatrix
            allPermissions={allPermissions}
            selectedIds={selectedPermissionIds}
            onToggle={togglePermission}
            disabled={!canEdit}
          />
          {canEdit && (
            <div className="mt-4">
              <Button onClick={handleSavePermissions} disabled={saving}>
                {saving ? t("saving") : t("savePermissions")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned users */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("assignedUsers")} ({role.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {role.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noUsers")}</p>
          ) : (
            <div className="space-y-2">
              {role.users.map((ur) => (
                <div
                  key={ur.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm text-foreground">{ur.userId}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
