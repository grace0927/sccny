"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog";
import AnnouncementFormDialog from "./AnnouncementFormDialog";

interface AnnouncementData {
  id: string;
  titleEn: string;
  titleZh: string;
  priority: string;
  audience: string;
  startDate: string;
  endDate: string;
  isPinned: boolean;
  status: string;
}

interface AnnouncementTableProps {
  initialData: AnnouncementData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

const priorityVariants: Record<string, "default" | "subtle" | "destructive"> = {
  NORMAL: "subtle",
  IMPORTANT: "default",
  URGENT: "destructive",
};

const statusVariants: Record<string, "default" | "subtle" | "destructive"> = {
  DRAFT: "subtle",
  PUBLISHED: "default",
  ARCHIVED: "subtle",
};

export default function AnnouncementTable({ initialData, initialPagination }: AnnouncementTableProps) {
  const t = useTranslations("AnnouncementManagement");
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AnnouncementData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchData = useCallback(async (page: number, searchTerm: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/announcements?${params}`);
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
      fetchData(1, search, statusFilter || undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter, fetchData]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    if (res.ok) fetchData(pagination.page, search, statusFilter || undefined);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t("allStatuses")}</option>
          <option value="DRAFT">{t("draft")}</option>
          <option value="PUBLISHED">{t("published")}</option>
          <option value="ARCHIVED">{t("archived")}</option>
        </select>
        {hasPermission("announcements.create") && (
          <Button className="ml-auto" onClick={() => setShowCreateForm(true)}>{t("createAnnouncement")}</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("titleEn")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("priority")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("audience")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("dateRange")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("status")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("loading")}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("noAnnouncements")}</td></tr>
              ) : (
                data.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div>
                        <span className="text-sm font-medium text-foreground">{a.titleEn}</span>
                        {a.isPinned && <Badge variant="subtle" className="ml-2">{t("pinned")}</Badge>}
                        <span className="text-xs text-muted-foreground block">{a.titleZh}</span>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant={priorityVariants[a.priority]}>{t(`priority${a.priority}`)}</Badge></td>
                    <td className="p-4 text-sm text-muted-foreground">{a.audience === "ALL" ? t("audienceAll") : t("audienceMembers")}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(a.startDate).toLocaleDateString()} - {new Date(a.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-4"><Badge variant={statusVariants[a.status]}>{t(`status${a.status}`)}</Badge></td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission("announcements.edit") && (
                          <Button variant="outline" size="sm" onClick={() => setEditTarget(a)}>{t("edit")}</Button>
                        )}
                        {hasPermission("announcements.delete") && (
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(a.id)}>{t("delete")}</Button>
                        )}
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
            <Button variant="outline" size="sm" disabled={pagination.page <= 1}
              onClick={() => fetchData(pagination.page - 1, search, statusFilter || undefined)}>{t("previous")}</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchData(pagination.page + 1, search, statusFilter || undefined)}>{t("next")}</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("confirmDelete")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("delete")}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />

      {(showCreateForm || editTarget) && (
        <AnnouncementFormDialog
          initialData={editTarget || undefined}
          onClose={() => {
            setShowCreateForm(false);
            setEditTarget(null);
            fetchData(pagination.page, search, statusFilter || undefined);
          }}
        />
      )}
    </div>
  );
}
