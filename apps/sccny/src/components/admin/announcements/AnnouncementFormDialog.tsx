"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";

interface AnnouncementFormDialogProps {
  onClose: () => void;
  initialData?: {
    id: string;
    titleEn: string;
    titleZh: string;
    contentEn?: string;
    contentZh?: string;
    priority: string;
    audience: string;
    startDate: string;
    endDate: string;
    isPinned: boolean;
    status: string;
  };
}

export default function AnnouncementFormDialog({ onClose, initialData }: AnnouncementFormDialogProps) {
  const t = useTranslations("AnnouncementManagement");
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    titleEn: initialData?.titleEn || "",
    titleZh: initialData?.titleZh || "",
    contentEn: initialData?.contentEn || "",
    contentZh: initialData?.contentZh || "",
    priority: initialData?.priority || "NORMAL",
    audience: initialData?.audience || "ALL",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : "",
    isPinned: initialData?.isPinned || false,
    status: initialData?.status || "DRAFT",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/announcements/${initialData.id}` : "/api/admin/announcements";
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
          <h2 className="text-lg font-semibold mb-4">{isEdit ? t("editAnnouncement") : t("createAnnouncement")}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <Label>{t("contentZh")}</Label>
              <textarea value={form.contentZh} onChange={(e) => setForm({ ...form, contentZh: e.target.value })} required
                className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t("priority")}</Label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="NORMAL">{t("priorityNORMAL")}</option>
                  <option value="IMPORTANT">{t("priorityIMPORTANT")}</option>
                  <option value="URGENT">{t("priorityURGENT")}</option>
                </select>
              </div>
              <div>
                <Label>{t("audience")}</Label>
                <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="ALL">{t("audienceAll")}</option>
                  <option value="MEMBERS_ONLY">{t("audienceMembers")}</option>
                </select>
              </div>
              <div>
                <Label>{t("status")}</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="DRAFT">{t("draft")}</option>
                  <option value="PUBLISHED">{t("published")}</option>
                  <option value="ARCHIVED">{t("archived")}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("startDate")}</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div>
                <Label>{t("endDate")}</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPinned" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} />
              <Label htmlFor="isPinned">{t("pinned")}</Label>
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
