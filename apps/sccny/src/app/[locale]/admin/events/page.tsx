import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import EventTable from "@/components/admin/events/EventTable";

export default async function EventsAdminPage() {
  const t = await getTranslations("EventManagement");

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { startDate: "desc" },
      take: 20,
    }),
    prisma.event.count(),
  ]);

  const serialized = events.map((e) => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <EventTable
        initialData={serialized}
        initialPagination={{ page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) }}
      />
    </div>
  );
}
