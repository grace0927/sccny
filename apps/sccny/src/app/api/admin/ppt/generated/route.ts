import { NextResponse } from "next/server";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { listGeneratedPresentations } from "@/lib/google-drive";
import { prisma } from "@/lib/db";
import { toDateInputValue } from "@/lib/service-date";

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.generate");

    const folderId = process.env.GOOGLE_SLIDES_OUTPUT_FOLDER_ID;
    if (!folderId) {
      return NextResponse.json(
        { error: "Google Slides output folder is not configured" },
        { status: 503 }
      );
    }

    const files = await listGeneratedPresentations(folderId);

    // Attach the worship program each deck was generated from, when one was
    // recorded. Decks created before programs were persisted simply have none.
    const orders =
      files.length > 0
        ? await prisma.worshipOrder.findMany({
            where: { presentationId: { in: files.map((f) => f.id) } },
            select: { presentationId: true, date: true, rawText: true, data: true },
          })
        : [];
    const programs = new Map(orders.map((o) => [o.presentationId, o]));

    const data = files.map((file) => {
      const order = programs.get(file.id);
      return {
        ...file,
        program: order?.data
          ? {
              serviceDate: toDateInputValue(order.date),
              rawText: order.rawText ?? undefined,
              data: order.data,
            }
          : null,
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error listing generated presentations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
