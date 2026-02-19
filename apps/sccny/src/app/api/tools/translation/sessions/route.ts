import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { TranslationSessionCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

// GET - list sessions (public)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      prisma.translationSession.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { entries: true } } },
      }),
      prisma.translationSession.count({ where }),
    ]);

    return NextResponse.json({
      data: sessions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - create session (auth required)
export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();
    await requirePermission(user.id, "translation.operate");

    const body = await request.json();
    const validated = TranslationSessionCreateSchema.parse(body);

    const session = await prisma.translationSession.create({
      data: { ...validated, createdBy: user.id },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "translation_session",
      resourceId: session.id,
      newValues: validated as unknown as Record<string, unknown>,
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
