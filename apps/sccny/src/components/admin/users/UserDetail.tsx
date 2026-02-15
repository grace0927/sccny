"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState } from "react";
import ConfirmDialog from "../ConfirmDialog";

interface Role {
  id: string;
  name: string;
}

interface UserDetailData {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  createdAt: string | null;
  member: { id: string; status: string; name: string } | null;
  roles: Role[];
}

interface UserDetailProps {
  user: UserDetailData;
  allRoles: Role[];
}

export default function UserDetail({ user, allRoles }: UserDetailProps) {
  const t = useTranslations("UserManagement");
  const mt = useTranslations("MemberManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>(user.roles.map((r) => r.id));
  const [saving, setSaving] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [showEnable, setShowEnable] = useState(false);

  async function handleSaveRoles() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable() {
    const res = await fetch(`/api/admin/users/${user.id}/disable`, { method: "POST" });
    if (res.ok) router.refresh();
    setShowDisable(false);
  }

  async function handleEnable() {
    const res = await fetch(`/api/admin/users/${user.id}/enable`, { method: "POST" });
    if (res.ok) router.refresh();
    setShowEnable(false);
  }

  function toggleRole(roleId: string) {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("accountInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t("displayName")}</span>
              <p className="text-sm font-medium text-foreground">{user.displayName || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("email")}</span>
              <p className="text-sm font-medium text-foreground">{user.primaryEmail}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("joined")}</span>
              <p className="text-sm font-medium text-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          {hasPermission("users.disable") && (
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDisable(true)}
              >
                {t("disableAccount")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Member */}
      <Card>
        <CardHeader>
          <CardTitle>{t("linkedMember")}</CardTitle>
        </CardHeader>
        <CardContent>
          {user.member ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">{user.member.name}</span>
              <Badge variant={user.member.status === "ACTIVE" ? "default" : "subtle"}>
                {user.member.status === "ACTIVE" ? mt("statusActive") :
                 user.member.status === "PENDING" ? mt("statusPending") :
                 user.member.status === "INACTIVE" ? mt("statusInactive") : mt("statusRejected")}
              </Badge>
              <Link href={`/admin/members/${user.member.id}`}>
                <Button variant="outline" size="sm">{t("viewMember")}</Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noMemberRecord")}</p>
          )}
        </CardContent>
      </Card>

      {/* Role Assignment */}
      {hasPermission("users.roles") && (
        <Card>
          <CardHeader>
            <CardTitle>{t("roleAssignment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allRoles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">{role.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <Button onClick={handleSaveRoles} disabled={saving}>
                {saving ? "Saving..." : t("saveRoles")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={showDisable}
        title={t("confirmDisable")}
        description={t("confirmDisableDescription")}
        onConfirm={handleDisable}
        onCancel={() => setShowDisable(false)}
        destructive
      />
      <ConfirmDialog
        open={showEnable}
        title={t("confirmEnable")}
        description={t("confirmEnableDescription")}
        onConfirm={handleEnable}
        onCancel={() => setShowEnable(false)}
      />
    </div>
  );
}
