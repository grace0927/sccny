import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import SermonDetail from "@/components/admin/sermons/SermonDetail";

export default async function SermonDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;

  const sermon = await prisma.sermon.findUnique({ where: { id } });
  if (!sermon) notFound();

  const serialized = {
    ...sermon,
    date: sermon.date.toISOString(),
    createdAt: sermon.createdAt.toISOString(),
    updatedAt: sermon.updatedAt.toISOString(),
  };

  return <SermonDetail sermon={serialized} />;
}
