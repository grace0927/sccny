"use client";

import { useTranslations } from "next-intl";
import { Button, Input, Label } from "dark-blue";
import { useState } from "react";

interface MemberRejectDialogProps {
  open: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export default function MemberRejectDialog({ open, onConfirm, onCancel }: MemberRejectDialogProps) {
  const t = useTranslations("MemberManagement");
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-lg border border-border shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-foreground">{t("rejectDialog.title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("rejectDialog.description")}</p>
        <div className="mt-4">
          <Label>{t("rejectDialog.reasonLabel")}</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("rejectDialog.reasonPlaceholder")}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("form.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim()}
          >
            {t("rejectDialog.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
