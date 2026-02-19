import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { WorshipOrderCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.view");

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    const [data, total] = await Promise.all([
      prisma.worshipOrder.findMany({
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, type: true, sortOrder: true, title: true, titleZh: true },
          },
        },
      }),
      prisma.worshipOrder.count(),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching worship orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "ppt.create");

    const body = await request.json();
    const validated = WorshipOrderCreateSchema.parse(body);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.worshipOrder.create({
        data: {
          name: validated.name,
          date: new Date(validated.date),
          templateId: validated.templateId || null,
          createdBy: user.id,
        },
      });

      if (validated.items && validated.items.length > 0) {
        await tx.worshipOrderItem.createMany({
          data: validated.items.map((item) => ({
            orderId: created.id,
            type: item.type,
            sortOrder: item.sortOrder,
            title: item.title || null,
            titleZh: item.titleZh || null,
            content: item.content || null,
            contentZh: item.contentZh || null,
            hymnId: item.hymnId || null,
            scriptureRef: item.scriptureRef || null,
          })),
        });
      }

      return tx.worshipOrder.findUnique({
        where: { id: created.id },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      });
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "worship_order",
      resourceId: order!.id,
      newValues: { name: validated.name, date: validated.date, itemCount: validated.items.length },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating worship order:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
