"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";

interface EventFormDialogProps {
  onClose: () => void;
  initialData?: {
    id: string;
    titleEn: string;
    titleZh: string;
    descriptionEn?: string | null;
    descriptionZh?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    type: string;
    status: string;
    registrationUrl?: string | null;
    coverImage?: string | null;
  };
}

export default function EventFormDialog({ onClose, initialData }: EventFormDialogProps) {
  const t = useTranslations("EventManagement");
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    titleEn: initialData?.titleEn || "",
    titleZh: initialData?.titleZh || "",
    descriptionEn: initialData?.descriptionEn || "",
    descriptionZh: initialData?.descriptionZh || "",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "",
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "",
    location: initialData?.location || "",
    type: initialData?.type || "OTHER",
    status: initialData?.status || "DRAFT",
    registrationUrl: initialData?.registrationUrl || "",
    coverImage: initialData?.coverImage || "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/events/${initialData.id}` : "/api/admin/events";
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
          <h2 className="text-lg font-semibold mb-4">{isEdit ? t("editEvent") : t("createEvent")}</h2>
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
              <Label>{t("descriptionEn")}</Label>
              <textarea value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <Label>{t("descriptionZh")}</Label>
              <textarea value={form.descriptionZh} onChange={(e) => setForm({ ...form, descriptionZh: e.target.value })}
                className="w-full min-h-[80px] rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("startDate")}</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              </div>
              <div>
                <Label>{t("endDate")}</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>{t("location")}</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <Label>{t("type")}</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="WORSHIP">{t("typeWorship")}</option>
                  <option value="FELLOWSHIP">{t("typeFellowship")}</option>
                  <option value="RETREAT">{t("typeRetreat")}</option>
                  <option value="CONFERENCE">{t("typeConference")}</option>
                  <option value="HOLIDAY">{t("typeHoliday")}</option>
                  <option value="OTHER">{t("typeOther")}</option>
                </select>
              </div>
              <div>
                <Label>{t("status")}</Label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="DRAFT">{t("draft")}</option>
                  <option value="PUBLISHED">{t("published")}</option>
                  <option value="CANCELLED">{t("cancelled")}</option>
                  <option value="ARCHIVED">{t("archived")}</option>
                </select>
              </div>
            </div>
            <div>
              <Label>{t("registrationUrl")}</Label>
              <Input value={form.registrationUrl} onChange={(e) => setForm({ ...form, registrationUrl: e.target.value })} placeholder="https://" />
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
