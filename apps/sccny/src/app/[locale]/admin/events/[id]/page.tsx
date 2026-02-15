import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import EventFormDialog from "@/components/admin/events/EventFormDialog";
import { Card, CardContent, CardHeader, Badge } from "dark-blue";

const typeLabels: Record<string, string> = {
  WORSHIP: "Worship",
  FELLOWSHIP: "Fellowship",
  RETREAT: "Retreat",
  CONFERENCE: "Conference",
  HOLIDAY: "Holiday",
  OTHER: "Other",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("EventManagement");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: { orderBy: { createdAt: "desc" } },
      _count: { select: { registrations: true } },
    },
  });
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{event.titleEn}</h1>
        <Badge variant={event.status === "PUBLISHED" ? "default" : "subtle"}>{event.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">{t("details")}</h2></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">{t("titleZh")}</span>
              <p>{event.titleZh}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("date")}</span>
              <p>{new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("location")}</span>
              <p>{event.location || "—"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("type")}</span>
              <p><Badge variant="subtle">{typeLabels[event.type]}</Badge></p>
            </div>
            {event.descriptionEn && (
              <div>
                <span className="text-sm text-muted-foreground">{t("descriptionEn")}</span>
                <p className="text-sm">{event.descriptionEn}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{t("registrations")} ({event._count.registrations})</h2>
          </CardHeader>
          <CardContent>
            {event.registrations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noRegistrations")}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">{t("name")}</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">{t("email")}</th>
                    <th className="text-left p-2 text-sm font-medium text-muted-foreground">{t("registeredAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {event.registrations.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="p-2 text-sm">{r.name}</td>
                      <td className="p-2 text-sm text-muted-foreground">{r.email || "—"}</td>
                      <td className="p-2 text-sm text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
