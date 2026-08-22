import { NextRequest, NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { WorshipOrderData } from "@/lib/parse-worship-order";
import {
  generateWorshipSlides,
  InvalidScriptureRefsError,
  SlidesNotConfiguredError,
} from "@/lib/generate-worship-slides";

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const body: WorshipOrderData & { serviceDate?: string } = await request.json();

    const { presentationId, presentationUrl, missingHymns, title } =
      await generateWorshipSlides(body);

    await logAction({
      userId: user.id,
      userName: user.displayName ?? user.primaryEmail ?? "Unknown",
      action: "CREATE",
      resourceType: "GoogleSlides",
      resourceId: presentationId,
      newValues: {
        title,
        sermonTitle: body.sermonTitle,
        speaker: body.speaker,
        hymns: body.hymns.map((h) => `${h.number} ${h.title}`).join(", "),
      },
    });

    return NextResponse.json({ presentationUrl, presentationId, missingHymns });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof SlidesNotConfiguredError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    if (error instanceof InvalidScriptureRefsError) {
      return NextResponse.json(
        { error: "经文引用无效", invalidRefs: error.invalidRefs },
        { status: 400 }
      );
    }
    console.error("Error generating slides:", error);
    return NextResponse.json(
      { error: "Failed to generate slides. Please try again." },
      { status: 500 }
    );
  }
}
