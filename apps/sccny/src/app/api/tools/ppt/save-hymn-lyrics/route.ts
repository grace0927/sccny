import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { SaveHymnLyricsSchema } from "@/lib/admin-validations";

/**
 * Save reviewed lyrics into the Hymn table (upsert by hymn number).
 * Gated by ppt.generate — the PPT operator role has no hymns.create/edit,
 * but saving lyrics is part of the slide-generation workflow.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body = await request.json();
    const validated = SaveHymnLyricsSchema.parse(body);

    const existing = await prisma.hymn.findFirst({
      where: { number: validated.number },
      select: { id: true },
    });

    const data = {
      titleZh: validated.titleZh,
      lyricsZh: validated.lyricsZh,
      ...(validated.titleEn ? { titleEn: validated.titleEn } : {}),
      ...(validated.lyricsEn ? { lyricsEn: validated.lyricsEn } : {}),
    };

    const hymn = existing
      ? await prisma.hymn.update({ where: { id: existing.id }, data })
      : await prisma.hymn.create({
          data: {
            number: validated.number,
            titleEn: validated.titleEn ?? "",
            lyricsEn: validated.lyricsEn ?? "",
            ...data,
            createdBy: user.id,
          },
        });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: existing ? "UPDATE" : "CREATE",
      resourceType: "hymn",
      resourceId: hymn.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(hymn, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error saving hymn lyrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
