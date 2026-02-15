"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog";
import EventFormDialog from "./EventFormDialog";

interface EventData {
  id: string;
  titleEn: string;
  titleZh: string;
  startDate: string;
  endDate: string;
  location: string | null;
  type: string;
  status: string;
  _count?: { registrations: number };
}

interface EventTableProps {
  initialData: EventData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

const typeLabels: Record<string, string> = {
  WORSHIP: "Worship",
  FELLOWSHIP: "Fellowship",
  RETREAT: "Retreat",
  CONFERENCE: "Conference",
  HOLIDAY: "Holiday",
  OTHER: "Other",
};

const statusVariants: Record<string, "default" | "subtle" | "destructive"> = {
  DRAFT: "subtle",
  PUBLISHED: "default",
  CANCELLED: "destructive",
  ARCHIVED: "subtle",
};

export default function EventTable({ initialData, initialPagination }: EventTableProps) {
  const t = useTranslations("EventManagement");
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchData = useCallback(async (page: number, searchTerm: string, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/events?${params}`);
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
    const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
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
          <option value="CANCELLED">{t("cancelled")}</option>
          <option value="ARCHIVED">{t("archived")}</option>
        </select>
        {hasPermission("events.create") && (
          <Button className="ml-auto" onClick={() => setShowCreateForm(true)}>{t("createEvent")}</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("titleEn")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("date")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("location")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("type")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("registrations")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("status")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("loading")}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("noEvents")}</td></tr>
              ) : (
                data.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">{e.titleEn}</span>
                      <span className="text-xs text-muted-foreground block">{e.titleZh}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(e.startDate).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{e.location || "—"}</td>
                    <td className="p-4"><Badge variant="subtle">{typeLabels[e.type] || e.type}</Badge></td>
                    <td className="p-4 text-sm text-muted-foreground">{e._count?.registrations || 0}</td>
                    <td className="p-4"><Badge variant={statusVariants[e.status]}>{t(`status${e.status}`)}</Badge></td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/events/${e.id}`}>
                          <Button variant="outline" size="sm">{t("viewDetails")}</Button>
                        </Link>
                        {hasPermission("events.delete") && (
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(e.id)}>{t("delete")}</Button>
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

      {showCreateForm && (
        <EventFormDialog
          onClose={() => {
            setShowCreateForm(false);
            fetchData(1, search, statusFilter || undefined);
          }}
        />
      )}
    </div>
  );
}
