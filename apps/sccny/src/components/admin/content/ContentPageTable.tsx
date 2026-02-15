"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, Badge, Button, Input } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState, useEffect, useCallback } from "react";
import ContentPageFormDialog from "./ContentPageFormDialog";

interface ContentPageData {
  id: string;
  slug: string;
  titleEn: string;
  titleZh: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
}

interface ContentPageTableProps {
  initialData: ContentPageData[];
  initialPagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function ContentPageTable({ initialData, initialPagination }: ContentPageTableProps) {
  const t = useTranslations("ContentManagement");
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchData = useCallback(async (page: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (searchTerm) params.set("search", searchTerm);
      const res = await fetch(`/api/admin/content?${params}`);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {hasPermission("content.edit") && (
          <Button className="ml-auto" onClick={() => setShowCreateForm(true)}>{t("createPage")}</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("slug")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("titleEn")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("titleZh")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("status")}</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t("lastUpdated")}</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("loading")}</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t("noPages")}</td></tr>
              ) : (
                data.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-4"><code className="text-sm text-muted-foreground">{p.slug}</code></td>
                    <td className="p-4 text-sm font-medium text-foreground">{p.titleEn}</td>
                    <td className="p-4 text-sm text-muted-foreground">{p.titleZh}</td>
                    <td className="p-4">
                      <Badge variant={p.status === "PUBLISHED" ? "default" : "subtle"}>
                        {t(`status${p.status}`)}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/content/${p.slug}`}>
                        <Button variant="outline" size="sm">{t("edit")}</Button>
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
            <Button variant="outline" size="sm" disabled={pagination.page <= 1}
              onClick={() => fetchData(pagination.page - 1, search)}>{t("previous")}</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchData(pagination.page + 1, search)}>{t("next")}</Button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <ContentPageFormDialog
          onClose={() => {
            setShowCreateForm(false);
            fetchData(1, search);
          }}
        />
      )}
    </div>
  );
}
