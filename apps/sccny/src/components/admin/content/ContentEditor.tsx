"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, Button, Badge, Label } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState } from "react";

interface ContentEditorProps {
  page: {
    id: string;
    slug: string;
    titleEn: string;
    titleZh: string;
    contentEn: string;
    contentZh: string;
    status: string;
    publishedAt: string | null;
    revisions?: { id: string; createdAt: string; editedById: string | null }[];
  };
}

export default function ContentEditor({ page }: ContentEditorProps) {
  const t = useTranslations("ContentManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [form, setForm] = useState({
    titleEn: page.titleEn,
    titleZh: page.titleZh,
    contentEn: page.contentEn,
    contentZh: page.contentZh,
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/${page.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/content/${page.slug}/publish`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{page.titleEn}</h1>
          <p className="text-sm text-muted-foreground">/{page.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={page.status === "PUBLISHED" ? "default" : "subtle"}>{t(`status${page.status}`)}</Badge>
          {hasPermission("content.publish") && page.status !== "PUBLISHED" && (
            <Button variant="outline" onClick={handlePublish} disabled={publishing}>
              {publishing ? t("publishing") : t("publish")}
            </Button>
          )}
          {hasPermission("content.edit") && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">English</h2></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("titleEn")}</Label>
              <input
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <Label>{t("contentEn")}</Label>
              <textarea
                value={form.contentEn}
                onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                className="w-full min-h-[400px] rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">中文</h2></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("titleZh")}</Label>
              <input
                value={form.titleZh}
                onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
                className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div>
              <Label>{t("contentZh")}</Label>
              <textarea
                value={form.contentZh}
                onChange={(e) => setForm({ ...form, contentZh: e.target.value })}
                className="w-full min-h-[400px] rounded-md border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {page.revisions && page.revisions.length > 0 && (
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">{t("revisionHistory")}</h2></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {page.revisions.map((rev) => (
                <li key={rev.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{new Date(rev.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
