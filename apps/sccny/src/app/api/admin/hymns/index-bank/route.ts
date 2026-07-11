import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { indexHymnBank, buildPresentationUrl } from "@/lib/google-slides";

const HYMN_BANK_ID = process.env.GOOGLE_HYMN_BANK_ID;

/**
 * Scan the Google Slides hymn bank and upsert each hymn's slide range
 * (slidesUrl + slideStartIndex/slideEndIndex) into the Hymn table.
 * Existing titles and lyrics are never overwritten.
 */
export async function POST() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "hymns.edit");

    if (!HYMN_BANK_ID) {
      return NextResponse.json(
        { error: "GOOGLE_HYMN_BANK_ID is not configured" },
        { status: 503 }
      );
    }

    const entries = await indexHymnBank(HYMN_BANK_ID);
    const slidesUrl = buildPresentationUrl(HYMN_BANK_ID);

    const numbers = entries.map((e) => e.number);
    const existing = await prisma.hymn.findMany({
      where: { number: { in: numbers } },
      select: { id: true, number: true, titleEn: true, titleZh: true },
    });
    const existingByNumber = new Map(existing.map((h) => [h.number, h]));

    let created = 0;
    let updated = 0;
    for (const entry of entries) {
      const record = existingByNumber.get(entry.number);
      if (record) {
        await prisma.hymn.update({
          where: { id: record.id },
          data: {
            slidesUrl,
            slideStartIndex: entry.startIndex,
            slideEndIndex: entry.endIndex,
            // Fill empty titles from the bank; never overwrite curated ones
            ...(record.titleZh.trim() ? {} : { titleZh: entry.titleZh }),
            ...(record.titleEn.trim() || !entry.titleEn ? {} : { titleEn: entry.titleEn }),
          },
        });
        updated++;
      } else {
        await prisma.hymn.create({
          data: {
            number: entry.number,
            titleZh: entry.titleZh,
            titleEn: entry.titleEn,
            lyricsZh: "",
            lyricsEn: "",
            slidesUrl,
            slideStartIndex: entry.startIndex,
            slideEndIndex: entry.endIndex,
            createdBy: user.id,
          },
        });
        created++;
      }
    }

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "UPDATE",
      resourceType: "hymn",
      resourceId: HYMN_BANK_ID,
      newValues: { indexed: entries.length, created, updated },
    });

    return NextResponse.json({ indexed: entries.length, created, updated });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error indexing hymn bank:", error);
    return NextResponse.json({ error: "Failed to index hymn bank" }, { status: 500 });
  }
}
