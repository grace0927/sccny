"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog";
import SermonFormDialog from "./SermonFormDialog";

interface SermonData {
  id: string;
  title: string;
  speaker: string;
  date: string;
  type: string;
  series: string | null;
  scripture: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
}

interface SermonTableProps {
  initialData: SermonData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

const typeLabels: Record<string, string> = {
  SERMON: "Sermon",
  SUNDAY_SCHOOL: "Sunday School",
  RETREAT_MESSAGE: "Retreat",
  BAPTISM_CLASS: "Baptism Class",
};

export default function SermonTable({ initialData, initialPagination }: SermonTableProps) {
  const t = useTranslations("SermonManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);

  const fetchSermons = useCallback(async (page: number, searchTerm: string, type?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      if (type) params.set("type", type);
      params.set("sortBy", "date");
      params.set("sortOrder", "desc");
      const res = await fetch(`/api/admin/sermons?${params}`);
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
      fetchSermons(1, search, typeFilter || undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, typeFilter, fetchSermons]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/sermons/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchSermons(pagination.page, search, typeFilter || undefined);
    }
    setDeleteTarget(null);
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    const res = await fetch("/api/admin/sermons/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), action: "delete" }),
    });
    if (res.ok) {
      setSelectedIds(new Set());
      fetchSermons(pagination.page, search, typeFilter || undefined);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/admin/sermons/sync", { method: "POST" });
      fetchSermons(1, search, typeFilter || undefined);
    } finally {
      setSyncing(false);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleSelectAll() {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((d) => d.id)));
    }
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="">{t("allTypes")}</option>
          <option value="SERMON">{t("typeSermon")}</option>
          <option value="SUNDAY_SCHOOL">{t("typeSundaySchool")}</option>
          <option value="RETREAT_MESSAGE">{t("typeRetreat")}</option>
          <option value="BAPTISM_CLASS">{t("typeBaptism")}</option>
        </select>
        <div className="flex gap-2 ml-auto">
          {hasPermission("sermons.sync") && (
            <Button variant="outline" onClick={handleSync} disabled={syncing}>
              {syncing ? t("syncing") : t("syncSermons")}
            </Button>
          )}
          {hasPermission("sermons.create") && (
            <Button onClick={() => setShowCreateForm(true)}>{t("createSermon")}</Button>
          )}
        </div>
      </div>

      {selectedIds.size > 0 && hasPermission("sermons.delete") && (
        <div className="flex items-center gap-4 p-3 bg-muted rounded-md">
          <span className="text-sm">{t("selected", { count: selectedIds.size })}</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            {t("deleteSelected")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
            {t("clearSelection")}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 w-10">
                  <input type="checkbox" checked={selectedIds.size === data.length && data.length > 0} onChange={toggleSelectAll} />
                </th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("title")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("speaker")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("date")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("type")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("media")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("loading")}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("noSermons")}</td></tr>
              ) : (
                data.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => toggleSelect(s.id)} />
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium text-foreground">{s.title}</span>
                      {s.series && <span className="text-xs text-muted-foreground block">{s.series}</span>}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{s.speaker}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(s.date).toLocaleDateString()}</td>
                    <td className="p-4"><Badge variant="subtle">{typeLabels[s.type] || s.type}</Badge></td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {s.videoUrl && <Badge variant="subtle">V</Badge>}
                        {s.audioUrl && <Badge variant="subtle">A</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/sermons/${s.id}`}>
                          <Button variant="outline" size="sm">{t("edit")}</Button>
                        </Link>
                        {hasPermission("sermons.delete") && (
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(s.id)}>
                            {t("delete")}
                          </Button>
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
              onClick={() => fetchSermons(pagination.page - 1, search, typeFilter || undefined)}>{t("previous")}</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchSermons(pagination.page + 1, search, typeFilter || undefined)}>{t("next")}</Button>
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
        <SermonFormDialog
          onClose={() => {
            setShowCreateForm(false);
            fetchSermons(1, search, typeFilter || undefined);
          }}
        />
      )}
    </div>
  );
}
