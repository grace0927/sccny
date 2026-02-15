"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

interface MemberFormDialogProps {
  onClose: () => void;
  initialData?: {
    id: string;
    name: string;
    nameZh: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    birthday: string | null;
    baptismDate: string | null;
    fellowshipGroup: string | null;
    ministryAssignments: string[];
  };
}

export default function MemberFormDialog({ onClose, initialData }: MemberFormDialogProps) {
  const t = useTranslations("MemberManagement");
  const router = useRouter();
  const isEdit = !!initialData;

  const [form, setForm] = useState({
    name: initialData?.name || "",
    nameZh: initialData?.nameZh || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    birthday: initialData?.birthday || "",
    baptismDate: initialData?.baptismDate || "",
    fellowshipGroup: initialData?.fellowshipGroup || "",
    ministryAssignments: initialData?.ministryAssignments?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: form.name,
      nameZh: form.nameZh || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      birthday: form.birthday || undefined,
      baptismDate: form.baptismDate || undefined,
      fellowshipGroup: form.fellowshipGroup || undefined,
      ministryAssignments: form.ministryAssignments
        ? form.ministryAssignments.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    };

    try {
      const url = isEdit ? `/api/admin/members/${initialData.id}` : "/api/admin/members";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.refresh();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save member");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {isEdit ? t("form.editTitle") : t("form.createTitle")}
        </h3>

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("name")} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t("form.namePlaceholder")}
              required
            />
          </div>
          <div>
            <Label>{t("chineseName")}</Label>
            <Input
              value={form.nameZh}
              onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
              placeholder={t("form.nameZhPlaceholder")}
            />
          </div>
          <div>
            <Label>{t("email")}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t("form.emailPlaceholder")}
            />
          </div>
          <div>
            <Label>{t("phone")}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={t("form.phonePlaceholder")}
            />
          </div>
          <div>
            <Label>{t("address")}</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={t("form.addressPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("birthday")}</Label>
              <Input
                type="date"
                value={form.birthday}
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("baptismDate")}</Label>
              <Input
                type="date"
                value={form.baptismDate}
                onChange={(e) => setForm({ ...form, baptismDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>{t("fellowshipGroup")}</Label>
            <Input
              value={form.fellowshipGroup}
              onChange={(e) => setForm({ ...form, fellowshipGroup: e.target.value })}
              placeholder={t("form.groupPlaceholder")}
            />
          </div>
          <div>
            <Label>{t("ministryAssignments")}</Label>
            <Input
              value={form.ministryAssignments}
              onChange={(e) => setForm({ ...form, ministryAssignments: e.target.value })}
              placeholder={t("form.ministryPlaceholder")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              {t("form.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("form.saving") : t("form.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
