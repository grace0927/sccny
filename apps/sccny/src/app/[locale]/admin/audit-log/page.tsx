import { getTranslations } from "next-intl/server";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

export default async function AuditLogPage() {
  const t = await getTranslations("AuditLog");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <AuditLogViewer />
    </div>
  );
}
