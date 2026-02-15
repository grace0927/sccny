"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";

interface UserData {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  createdAt: string | null;
  memberStatus: string | null;
  roles: { id: string; name: string }[];
}

interface UserTableProps {
  initialData: UserData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

function MemberStatusChip({ status }: { status: string | null }) {
  const t = useTranslations("MemberManagement");
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const variants: Record<string, "default" | "subtle" | "destructive"> = {
    ACTIVE: "default",
    PENDING: "subtle",
    INACTIVE: "subtle",
    REJECTED: "destructive",
  };
  const labels: Record<string, string> = {
    ACTIVE: t("statusActive"),
    PENDING: t("statusPending"),
    INACTIVE: t("statusInactive"),
    REJECTED: t("statusRejected"),
  };
  return <Badge variant={variants[status] || "subtle"}>{labels[status] || status}</Badge>;
}

export default function UserTable({ initialData, initialPagination }: UserTableProps) {
  const t = useTranslations("UserManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers(1, search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchUsers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {hasPermission("users.invite") && (
          <Link href="/admin/users?invite=true">
            <Button>{t("inviteUser")}</Button>
          </Link>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("name")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("email")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("memberStatus")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("roles")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">{t("noUsers")}</td>
                </tr>
              ) : (
                data.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-sm font-medium text-foreground">{u.displayName || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{u.primaryEmail}</td>
                    <td className="p-4"><MemberStatusChip status={u.memberStatus} /></td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.map((r) => (
                          <Badge key={r.id} variant="subtle">{r.name}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/users/${u.id}`}>
                        <Button variant="outline" size="sm">{t("viewDetail")}</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("page")} {pagination.page} / {pagination.totalPages} ({pagination.total} {t("total")})
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1, search)}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchUsers(pagination.page + 1, search)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
