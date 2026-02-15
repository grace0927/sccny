"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog";
import MemberFormDialog from "./MemberFormDialog";
import MemberRejectDialog from "./MemberRejectDialog";

interface MemberData {
  id: string;
  name: string;
  nameZh: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  fellowshipGroup: string | null;
  createdAt: string;
}

interface MemberTableProps {
  initialData: MemberData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
  initialTab?: "pending" | "all";
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("MemberManagement");
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

export default function MemberTable({ initialData, initialPagination, initialTab = "all" }: MemberTableProps) {
  const t = useTranslations("MemberManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [approveTarget, setApproveTarget] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  const fetchMembers = useCallback(async (page: number, searchTerm: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      if (status) params.set("status", status);
      params.set("sortBy", "createdAt");
      params.set("sortOrder", "desc");
      const res = await fetch(`/api/admin/members?${params}`);
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
      fetchMembers(1, search, tab === "pending" ? "PENDING" : undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, tab, fetchMembers]);

  async function handleApprove(id: string) {
    const res = await fetch(`/api/admin/members/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      fetchMembers(pagination.page, search, tab === "pending" ? "PENDING" : undefined);
    }
    setApproveTarget(null);
  }

  async function handleReject(id: string, reason: string) {
    const res = await fetch(`/api/admin/members/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejectionReason: reason }),
    });
    if (res.ok) {
      fetchMembers(pagination.page, search, tab === "pending" ? "PENDING" : undefined);
    }
    setRejectTarget(null);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("pending")}
        >
          {t("tabs.pending")}
        </Button>
        <Button
          variant={tab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("all")}
        >
          {t("tabs.all")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {hasPermission("members.create") && (
          <Button onClick={() => setShowCreateForm(true)}>{t("addMember")}</Button>
        )}
        {hasPermission("members.export") && (
          <a href="/api/admin/members/export" download>
            <Button variant="outline">{t("export")}</Button>
          </a>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("name")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("email")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("phone")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("status")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("fellowshipGroup")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {tab === "pending" ? t("noPending") : t("noMembers")}
                  </td>
                </tr>
              ) : (
                data.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div>
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
                        {m.nameZh && <span className="text-sm text-muted-foreground ml-1">({m.nameZh})</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{m.email || "—"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{m.phone || "—"}</td>
                    <td className="p-4"><StatusBadge status={m.status} /></td>
                    <td className="p-4 text-sm text-muted-foreground">{m.fellowshipGroup || "—"}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {m.status === "PENDING" && hasPermission("members.approve") && (
                          <>
                            <Button variant="default" size="sm" onClick={() => setApproveTarget(m.id)}>
                              {t("approve")}
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setRejectTarget(m.id)}>
                              {t("reject")}
                            </Button>
                          </>
                        )}
                        <Link href={`/admin/members/${m.id}`}>
                          <Button variant="outline" size="sm">{t("viewDetail")}</Button>
                        </Link>
                      </div>
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
              onClick={() => fetchMembers(pagination.page - 1, search, tab === "pending" ? "PENDING" : undefined)}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchMembers(pagination.page + 1, search, tab === "pending" ? "PENDING" : undefined)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!approveTarget}
        title={t("approveDialog.title")}
        description={t("approveDialog.description")}
        confirmLabel={t("approveDialog.confirm")}
        onConfirm={() => approveTarget && handleApprove(approveTarget)}
        onCancel={() => setApproveTarget(null)}
      />

      {rejectTarget && (
        <MemberRejectDialog
          open={!!rejectTarget}
          onConfirm={(reason) => handleReject(rejectTarget, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      {showCreateForm && (
        <MemberFormDialog
          onClose={() => {
            setShowCreateForm(false);
            fetchMembers(1, search, tab === "pending" ? "PENDING" : undefined);
          }}
        />
      )}
    </div>
  );
}
