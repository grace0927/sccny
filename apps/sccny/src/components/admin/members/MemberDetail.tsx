"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState } from "react";
import ConfirmDialog from "../ConfirmDialog";
import MemberFormDialog from "./MemberFormDialog";

interface MemberDetailData {
  id: string;
  userId: string;
  name: string;
  nameZh: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthday: string | null;
  baptismDate: string | null;
  memberSince: string | null;
  status: string;
  rejectionReason: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  fellowshipGroup: string | null;
  ministryAssignments: string[];
  createdAt: string;
}

interface MemberDetailProps {
  member: MemberDetailData;
}

export default function MemberDetail({ member }: MemberDetailProps) {
  const t = useTranslations("MemberManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);

  const statusLabels: Record<string, string> = {
    ACTIVE: t("statusActive"),
    PENDING: t("statusPending"),
    INACTIVE: t("statusInactive"),
    REJECTED: t("statusRejected"),
  };
  const statusVariants: Record<string, "default" | "subtle" | "destructive"> = {
    ACTIVE: "default",
    PENDING: "subtle",
    INACTIVE: "subtle",
    REJECTED: "destructive",
  };

  async function handleDeactivate() {
    const res = await fetch(`/api/admin/members/${member.id}/deactivate`, { method: "POST" });
    if (res.ok) router.refresh();
    setShowDeactivate(false);
  }

  async function handleReactivate() {
    const res = await fetch(`/api/admin/members/${member.id}/reactivate`, { method: "POST" });
    if (res.ok) router.refresh();
    setShowReactivate(false);
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("personalInfo")}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={statusVariants[member.status] || "subtle"}>
                {statusLabels[member.status] || member.status}
              </Badge>
              {hasPermission("members.edit") && (
                <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                  {t("viewDetail")}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t("name")}</span>
              <p className="text-sm font-medium text-foreground">{member.name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("chineseName")}</span>
              <p className="text-sm font-medium text-foreground">{member.nameZh || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("email")}</span>
              <p className="text-sm font-medium text-foreground">{member.email || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("phone")}</span>
              <p className="text-sm font-medium text-foreground">{member.phone || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("address")}</span>
              <p className="text-sm font-medium text-foreground">{member.address || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("birthday")}</span>
              <p className="text-sm font-medium text-foreground">{formatDate(member.birthday)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("baptismDate")}</span>
              <p className="text-sm font-medium text-foreground">{formatDate(member.baptismDate)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("memberSince")}</span>
              <p className="text-sm font-medium text-foreground">{formatDate(member.memberSince)}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("fellowshipGroup")}</span>
              <p className="text-sm font-medium text-foreground">{member.fellowshipGroup || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("ministryAssignments")}</span>
              <div className="flex gap-1 flex-wrap mt-1">
                {member.ministryAssignments.length > 0
                  ? member.ministryAssignments.map((m) => <Badge key={m} variant="subtle">{m}</Badge>)
                  : <span className="text-sm text-muted-foreground">—</span>}
              </div>
            </div>
          </div>

          {member.status === "REJECTED" && member.rejectionReason && (
            <div className="mt-4 p-3 bg-destructive/10 rounded-md">
              <span className="text-sm font-medium text-destructive">{t("rejectionReason")}:</span>
              <p className="text-sm text-destructive mt-1">{member.rejectionReason}</p>
            </div>
          )}

          {member.approvedAt && (
            <div className="mt-4 text-sm text-muted-foreground">
              {t("approvedAt")}: {formatDate(member.approvedAt)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Actions */}
      {hasPermission("members.deactivate") && (
        <div className="flex gap-2">
          {member.status === "ACTIVE" && (
            <Button variant="destructive" onClick={() => setShowDeactivate(true)}>
              {t("deactivate")}
            </Button>
          )}
          {member.status === "INACTIVE" && (
            <Button onClick={() => setShowReactivate(true)}>
              {t("reactivate")}
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showDeactivate}
        title={t("confirmDeactivate")}
        description={t("confirmDeactivateDescription")}
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivate(false)}
        destructive
      />
      <ConfirmDialog
        open={showReactivate}
        title={t("confirmReactivate")}
        description={t("confirmReactivateDescription")}
        onConfirm={handleReactivate}
        onCancel={() => setShowReactivate(false)}
      />

      {showEdit && (
        <MemberFormDialog
          onClose={() => {
            setShowEdit(false);
            router.refresh();
          }}
          initialData={{
            id: member.id,
            name: member.name,
            nameZh: member.nameZh,
            email: member.email,
            phone: member.phone,
            address: member.address,
            birthday: member.birthday ? new Date(member.birthday).toISOString().split("T")[0] : null,
            baptismDate: member.baptismDate ? new Date(member.baptismDate).toISOString().split("T")[0] : null,
            fellowshipGroup: member.fellowshipGroup,
            ministryAssignments: member.ministryAssignments,
          }}
        />
      )}
    </div>
  );
}
