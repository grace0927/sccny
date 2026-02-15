import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import ContentEditor from "@/components/admin/content/ContentEditor";

export default async function ContentEditPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;

  const page = await prisma.contentPage.findUnique({
    where: { slug },
    include: { revisions: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!page) notFound();

  const serialized = {
    ...page,
    publishedAt: page.publishedAt?.toISOString() || null,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    revisions: page.revisions.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return <ContentEditor page={serialized} />;
}
