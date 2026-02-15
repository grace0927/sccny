"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";

interface SermonFormDialogProps {
  onClose: () => void;
  initialData?: {
    id: string;
    title: string;
    speaker: string;
    date: string;
    type: string;
    series: string | null;
    scripture: string | null;
    description: string | null;
    videoUrl: string | null;
    audioUrl: string | null;
  };
}

export default function SermonFormDialog({ onClose, initialData }: SermonFormDialogProps) {
  const t = useTranslations("SermonManagement");
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    title: initialData?.title || "",
    speaker: initialData?.speaker || "",
    date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : "",
    type: initialData?.type || "SERMON",
    series: initialData?.series || "",
    scripture: initialData?.scripture || "",
    description: initialData?.description || "",
    videoUrl: initialData?.videoUrl || "",
    audioUrl: initialData?.audioUrl || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/sermons/${initialData.id}` : "/api/admin/sermons";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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
          <h2 className="text-lg font-semibold mb-4">{isEdit ? t("editSermon") : t("createSermon")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("title")}</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <Label>{t("speaker")}</Label>
                <Input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("date")}</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <Label>{t("type")}</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="SERMON">{t("typeSermon")}</option>
                  <option value="SUNDAY_SCHOOL">{t("typeSundaySchool")}</option>
                  <option value="RETREAT_MESSAGE">{t("typeRetreat")}</option>
                  <option value="BAPTISM_CLASS">{t("typeBaptism")}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("series")}</Label>
                <Input value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} />
              </div>
              <div>
                <Label>{t("scripture")}</Label>
                <Input value={form.scripture} onChange={(e) => setForm({ ...form, scripture: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t("description")}</Label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("videoUrl")}</Label>
                <Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://" />
              </div>
              <div>
                <Label>{t("audioUrl")}</Label>
                <Input value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://" />
              </div>
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
