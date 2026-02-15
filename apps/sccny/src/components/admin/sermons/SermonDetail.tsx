"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, Button, Badge } from "dark-blue";
import { usePermissions } from "@/lib/permissions-client";
import { useState } from "react";
import SermonFormDialog from "./SermonFormDialog";
import ConfirmDialog from "../ConfirmDialog";

interface SermonDetailProps {
  sermon: {
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
    createdAt: string;
    updatedAt: string;
  };
}

const typeLabels: Record<string, string> = {
  SERMON: "Sermon",
  SUNDAY_SCHOOL: "Sunday School",
  RETREAT_MESSAGE: "Retreat Message",
  BAPTISM_CLASS: "Baptism Class",
};

export default function SermonDetail({ sermon }: SermonDetailProps) {
  const t = useTranslations("SermonManagement");
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function handleDelete() {
    const res = await fetch(`/api/admin/sermons/${sermon.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/sermons");
    setShowDelete(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{sermon.title}</h1>
        <div className="flex gap-2">
          {hasPermission("sermons.edit") && (
            <Button onClick={() => setShowEdit(true)}>{t("edit")}</Button>
          )}
          {hasPermission("sermons.delete") && (
            <Button variant="destructive" onClick={() => setShowDelete(true)}>{t("delete")}</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{t("details")}</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t("speaker")}</span>
              <p className="font-medium">{sermon.speaker}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("date")}</span>
              <p className="font-medium">{new Date(sermon.date).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("type")}</span>
              <p><Badge variant="subtle">{typeLabels[sermon.type] || sermon.type}</Badge></p>
            </div>
            {sermon.series && (
              <div>
                <span className="text-sm text-muted-foreground">{t("series")}</span>
                <p className="font-medium">{sermon.series}</p>
              </div>
            )}
            {sermon.scripture && (
              <div>
                <span className="text-sm text-muted-foreground">{t("scripture")}</span>
                <p className="font-medium">{sermon.scripture}</p>
              </div>
            )}
          </div>
          {sermon.description && (
            <div>
              <span className="text-sm text-muted-foreground">{t("description")}</span>
              <p className="mt-1">{sermon.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {sermon.videoUrl && (
              <div>
                <span className="text-sm text-muted-foreground">{t("videoUrl")}</span>
                <p className="text-sm truncate"><a href={sermon.videoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sermon.videoUrl}</a></p>
              </div>
            )}
            {sermon.audioUrl && (
              <div>
                <span className="text-sm text-muted-foreground">{t("audioUrl")}</span>
                <p className="text-sm truncate"><a href={sermon.audioUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{sermon.audioUrl}</a></p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showEdit && (
        <SermonFormDialog
          initialData={sermon}
          onClose={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={showDelete}
        title={t("confirmDelete")}
        description={t("confirmDeleteDescription")}
        confirmLabel={t("delete")}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
