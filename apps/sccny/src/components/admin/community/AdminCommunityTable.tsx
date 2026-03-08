"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, Button, Alert, AlertDescription } from "dark-blue";
import { useState, useCallback } from "react";
import Image from "next/image";
import ConfirmDialog from "../ConfirmDialog";

interface PostMember {
  id: string;
  name: string;
  nameZh: string | null;
  email: string | null;
}

interface PostData {
  id: string;
  content: string;
  imageUrl: string | null;
  imageFileId: string | null;
  createdAt: string;
  member: PostMember;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AdminCommunityTableProps {
  initialData: PostData[];
  initialPagination: Pagination;
}

export default function AdminCommunityTable({ initialData, initialPagination }: AdminCommunityTableProps) {
  const t = useTranslations("AdminCommunity");

  const [data, setData] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPosts = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/community-posts?page=${page}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/community-posts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => prev.filter((p) => p.id !== id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1, totalPages: Math.ceil((prev.total - 1) / prev.limit) }));
        setMessage({ type: "success", text: t("deleteSuccess") });
      } else {
        setMessage({ type: "error", text: t("deleteError") });
      }
    } catch {
      setMessage({ type: "error", text: t("deleteError") });
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <Alert variant={message.type === "success" ? "success" : "destructive"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("member")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("content")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("image")}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("postedAt")}</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      ...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      {t("noPosts")}
                    </td>
                  </tr>
                ) : (
                  data.map((post) => (
                    <tr key={post.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{post.member.name}</p>
                        {post.member.nameZh && (
                          <p className="text-xs text-muted-foreground">{post.member.nameZh}</p>
                        )}
                        {post.member.email && (
                          <p className="text-xs text-muted-foreground">{post.member.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-foreground truncate whitespace-pre-wrap line-clamp-3 text-xs leading-relaxed">
                          {post.content}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {post.imageUrl ? (
                          <Image
                            src={post.imageUrl}
                            alt="Post image"
                            width={60}
                            height={45}
                            className="rounded object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(post.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 text-xs"
                        >
                          {t("delete")}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {pagination.total} posts
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchPosts(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-2">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchPosts(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("delete")}
        description={t("deleteConfirm")}
        confirmLabel={t("delete")}
        destructive
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
