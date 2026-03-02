"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription, Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "dark-blue";
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
          <Alert variant={message.type === "success" ? "success" : "destructive"} className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">{t("profileForm.name")} *</Label>
              <Input
                id="profile-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-name-zh">{t("profileForm.nameZh")}</Label>
              <Input
                id="profile-name-zh"
                value={form.nameZh}
                onChange={(e) => setForm({ ...form, nameZh: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">{t("profileForm.email")}</Label>
              <Input
                id="profile-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">{t("profileForm.phone")}</Label>
              <Input
                id="profile-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-address">{t("profileForm.address")}</Label>
            <Input
              id="profile-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-birthday">{t("profileForm.birthday")}</Label>
            <Input
              id="profile-birthday"
              type="date"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
              className="max-w-xs"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? t("profileForm.saving") : t("profileForm.save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
