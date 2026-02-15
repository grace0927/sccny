import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { SermonBulkActionSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const validated = SermonBulkActionSchema.parse(body);

    if (validated.action === "delete") {
      await requirePermission(user.id, "sermons.delete");

      const deleted = await prisma.sermon.deleteMany({
        where: { id: { in: validated.ids } },
      });

      await logAction({
        userId: user.id,
        userName: user.displayName || user.primaryEmail || "Unknown",
        action: "DELETE",
        resourceType: "sermon",
        newValues: { ids: validated.ids, count: deleted.count },
      });

      return NextResponse.json({ success: true, count: deleted.count });
    }

    if (validated.action === "changeType" && validated.type) {
      await requirePermission(user.id, "sermons.edit");

      const updated = await prisma.sermon.updateMany({
        where: { id: { in: validated.ids } },
        data: { type: validated.type },
      });

      await logAction({
        userId: user.id,
        userName: user.displayName || user.primaryEmail || "Unknown",
        action: "UPDATE",
        resourceType: "sermon",
        newValues: { ids: validated.ids, type: validated.type, count: updated.count },
      });

      return NextResponse.json({ success: true, count: updated.count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error in bulk sermon action:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
