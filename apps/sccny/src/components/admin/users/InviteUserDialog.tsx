"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button, Input, Label } from "dark-blue";

interface InviteUserDialogProps {
  onClose: () => void;
}

export default function InviteUserDialog({ onClose }: InviteUserDialogProps) {
  const t = useTranslations("UserManagement");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/admin/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName }),
    });

    if (res.ok) {
      router.refresh();
      onClose();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to send invite");
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg border border-border shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          {t("inviteUser")}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invite-email">{t("inviteEmail")}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="invite-display-name">{t("inviteDisplayName")}</Label>
            <Input
              id="invite-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("inviting") : t("invite")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
