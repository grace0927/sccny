"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";
import ConfirmDialog from "../ConfirmDialog";
import HymnFormDialog from "./HymnFormDialog";

interface HymnData {
  id: string;
  number: number | null;
  titleEn: string;
  titleZh: string;
  lyricsEn: string;
  lyricsZh: string;
  author: string | null;
  composer: string | null;
  category: string | null;
  slidesUrl: string | null;
  slideStartIndex: number | null;
  slideEndIndex: number | null;
}

interface HymnTableProps {
  initialData: HymnData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function HymnTable({ initialData, initialPagination }: HymnTableProps) {
  const t = useTranslations("HymnManagement");
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editTarget, setEditTarget] = useState<HymnData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState<string | null>(null);

  const fetchData = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", sortBy: "number", sortOrder: "asc" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/admin/hymns?${params}`);
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
      fetchData(1, search);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, fetchData]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/hymns/${id}`, { method: "DELETE" });
    if (res.ok) fetchData(pagination.page, search);
    setDeleteTarget(null);
  }

  async function handleIndexBank() {
    setIndexing(true);
    setIndexMessage(null);
    try {
      const res = await fetch("/api/admin/hymns/index-bank", { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setIndexMessage(
          t("indexResult", { indexed: json.indexed, created: json.created, updated: json.updated })
        );
        fetchData(pagination.page, search);
      } else {
        setIndexMessage(t("indexFailed"));
      }
    } catch {
      setIndexMessage(t("indexFailed"));
    } finally {
      setIndexing(false);
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
        <div className="ml-auto flex items-center gap-2">
          {hasPermission("hymns.edit") && (
            <Button variant="outline" onClick={handleIndexBank} disabled={indexing}>
              {indexing ? t("indexing") : t("indexBank")}
            </Button>
          )}
          {hasPermission("hymns.create") && (
            <Button onClick={() => setShowCreateForm(true)}>{t("createHymn")}</Button>
          )}
        </div>
      </div>

      {indexMessage && <p className="text-sm text-muted-foreground">{indexMessage}</p>}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("number")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("titleZh")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("titleEn")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("bankSlides")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("lyrics")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("loading")}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("noHymns")}</td></tr>
              ) : (
                data.map((h) => (
                  <tr key={h.id} className="border-b border-border last:border-0">
                    <td className="p-4 text-sm text-foreground">{h.number ?? "—"}</td>
                    <td className="p-4 text-sm font-medium text-foreground">{h.titleZh}</td>
                    <td className="p-4 text-sm text-muted-foreground">{h.titleEn || "—"}</td>
                    <td className="p-4 text-sm">
                      {h.slidesUrl && h.slideStartIndex != null && h.slideEndIndex != null ? (
                        <a
                          href={h.slidesUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {t("slidePages", { start: h.slideStartIndex + 1, end: h.slideEndIndex + 1 })}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {h.lyricsZh.trim() && <Badge variant="subtle">中</Badge>}
                        {h.lyricsEn.trim() && <Badge variant="subtle">EN</Badge>}
                        {!h.lyricsZh.trim() && !h.lyricsEn.trim() && (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasPermission("hymns.edit") && (
                          <Button variant="outline" size="sm" onClick={() => setEditTarget(h)}>{t("edit")}</Button>
                        )}
                        {hasPermission("hymns.delete") && (
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(h.id)}>{t("delete")}</Button>
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
              onClick={() => fetchData(pagination.page - 1, search)}>{t("previous")}</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchData(pagination.page + 1, search)}>{t("next")}</Button>
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
        <HymnFormDialog
          initialData={editTarget || undefined}
          onClose={() => {
            setShowCreateForm(false);
            setEditTarget(null);
            fetchData(pagination.page, search);
          }}
        />
      )}
    </div>
  );
}
