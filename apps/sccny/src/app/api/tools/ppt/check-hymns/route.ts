import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";

interface HymnCheckInput {
  number: string;
  title: string;
}

export interface HymnCheckResult {
  number: string;
  title: string;
  /** bank = indexed slides in the hymn bank; db = stored lyrics only; missing = neither */
  status: "bank" | "db" | "missing";
  hymnId?: string;
  titleEn?: string;
  hasLyricsEn?: boolean;
}

/**
 * Report where each hymn's slides can come from, driven entirely by the
 * Hymn table (populated by the bank indexer and the lyrics workflow).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body: { hymns?: HymnCheckInput[] } = await request.json();
    const hymns = Array.isArray(body.hymns) ? body.hymns : [];

    const numbers = hymns
      .map((h) => parseInt(h.number, 10))
      .filter((n) => !isNaN(n));
    const records = numbers.length
      ? await prisma.hymn.findMany({
          where: { number: { in: numbers } },
          select: {
            id: true,
            number: true,
            titleEn: true,
            lyricsZh: true,
            lyricsEn: true,
            slidesUrl: true,
            slideStartIndex: true,
            slideEndIndex: true,
          },
        })
      : [];
    const byNumber = new Map(records.map((r) => [r.number, r]));

    const results: HymnCheckResult[] = hymns.map((h) => {
      const record = byNumber.get(parseInt(h.number, 10));
      if (!record) return { number: h.number, title: h.title, status: "missing" };

      const hasBankSlides =
        !!record.slidesUrl &&
        record.slideStartIndex != null &&
        record.slideEndIndex != null &&
        record.slideEndIndex > record.slideStartIndex;
      const status = hasBankSlides
        ? "bank"
        : record.lyricsZh.trim().length > 0
          ? "db"
          : "missing";

      return {
        number: h.number,
        title: h.title,
        status,
        hymnId: record.id,
        titleEn: record.titleEn || undefined,
        hasLyricsEn: record.lyricsEn.trim().length > 0,
      };
    });

    return NextResponse.json({ hymns: results });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error checking hymns:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
