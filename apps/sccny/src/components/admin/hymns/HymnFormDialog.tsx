"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";

interface HymnFormDialogProps {
  onClose: () => void;
  initialData?: {
    id: string;
    number: number | null;
    titleEn: string;
    titleZh: string;
    lyricsEn: string;
    lyricsZh: string;
    author: string | null;
    composer: string | null;
    category: string | null;
  };
}

export default function HymnFormDialog({ onClose, initialData }: HymnFormDialogProps) {
  const t = useTranslations("HymnManagement");
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    number: initialData?.number ?? "",
    titleEn: initialData?.titleEn || "",
    titleZh: initialData?.titleZh || "",
    lyricsEn: initialData?.lyricsEn || "",
    lyricsZh: initialData?.lyricsZh || "",
    author: initialData?.author || "",
    composer: initialData?.composer || "",
    category: initialData?.category || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/hymns/${initialData.id}` : "/api/admin/hymns";
      const method = isEdit ? "PATCH" : "POST";
      const payload = {
        ...form,
        number: form.number ? Number(form.number) : undefined,
        author: form.author || undefined,
        composer: form.composer || undefined,
        category: form.category || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          <h2 className="text-lg font-semibold mb-4">
            {isEdit ? t("editHymn") : t("createHymn")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t("number")}</Label>
                <Input
                  type="number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="#"
                />
              </div>
              <div>
                <Label>{t("titleEn")}</Label>
                <Input
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t("titleZh")}</Label>
                <Input
                  value={form.titleZh}
                  onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>{t("lyricsZh")}</Label>
              <textarea
                value={form.lyricsZh}
                onChange={(e) => setForm({ ...form, lyricsZh: e.target.value })}
                required
                className="w-full min-h-[150px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Separate verses with blank lines"
              />
            </div>
            <div>
              <Label>{t("lyricsEn")}</Label>
              <textarea
                value={form.lyricsEn}
                onChange={(e) => setForm({ ...form, lyricsEn: e.target.value })}
                required
                className="w-full min-h-[150px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Separate verses with blank lines"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t("author")}</Label>
                <Input
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("composer")}</Label>
                <Input
                  value={form.composer}
                  onChange={(e) => setForm({ ...form, composer: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("category")}</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Praise, Worship, Hymn"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
