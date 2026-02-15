"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "dark-blue";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";

interface ProfileFormProps {
  member: {
    name: string;
    nameZh: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    birthday: string | null;
  };
}

export default function ProfileForm({ member }: ProfileFormProps) {
  const t = useTranslations("MemberCorner");
  const router = useRouter();
  const [form, setForm] = useState({
    name: member.name,
    nameZh: member.nameZh || "",
    email: member.email || "",
    phone: member.phone || "",
    address: member.address || "",
    birthday: member.birthday || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nameZh: form.nameZh || undefined,
          email: form.email || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          birthday: form.birthday || undefined,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("profileForm.success") });
        router.refresh();
      } else {
        setMessage({ type: "error", text: t("profileForm.error") });
      }
    } catch {
      setMessage({ type: "error", text: t("profileForm.error") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <p className={`text-sm mb-4 ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("profileForm.name")} *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{t("profileForm.nameZh")}</Label>
            <Input
              value={form.nameZh}
              onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("profileForm.email")}</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("profileForm.phone")}</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("profileForm.address")}</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <Label>{t("profileForm.birthday")}</Label>
            <Input
              type="date"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? t("profileForm.saving") : t("profileForm.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
