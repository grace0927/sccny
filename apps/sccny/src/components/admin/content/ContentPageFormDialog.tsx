"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";

interface ContentPageFormDialogProps {
  onClose: () => void;
}

export default function ContentPageFormDialog({ onClose }: ContentPageFormDialogProps) {
  const t = useTranslations("ContentManagement");
  const [form, setForm] = useState({
    slug: "",
    titleEn: "",
    titleZh: "",
    contentEn: "",
    contentZh: "",
    status: "DRAFT",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg border border-border shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t("createPage")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{t("slug")}</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required placeholder="about-us" />
              <p className="text-xs text-muted-foreground mt-1">{t("slugHelp")}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("titleEn")}</Label>
                <Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} required />
              </div>
              <div>
                <Label>{t("titleZh")}</Label>
                <Input value={form.titleZh} onChange={(e) => setForm({ ...form, titleZh: e.target.value })} required />
              </div>
            </div>
            <div>
              <Label>{t("contentEn")}</Label>
              <textarea value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} required
                className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <Label>{t("contentZh")}</Label>
              <textarea value={form.contentZh} onChange={(e) => setForm({ ...form, contentZh: e.target.value })} required
                className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>{t("cancel")}</Button>
              <Button type="submit" disabled={saving}>{saving ? t("saving") : t("save")}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
