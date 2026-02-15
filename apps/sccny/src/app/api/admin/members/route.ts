import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { GetMembersQuerySchema, MemberCreateSchema } from "@/lib/admin-validations";
import { logAction } from "@/lib/audit";
import { Prisma } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, status, fellowshipGroup, sortBy, sortOrder } =
      GetMembersQuerySchema.parse(searchParams);

    const where: Prisma.MemberWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { nameZh: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    if (status) {
      where.status = status as Prisma.EnumMemberStatusFilter;
    }

    if (fellowshipGroup) {
      where.fellowshipGroup = fellowshipGroup;
    }

    const [data, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "members.create");

    const body = await request.json();
    const validated = MemberCreateSchema.parse(body);

    const member = await prisma.member.create({
      data: {
        userId: `admin-created-${Date.now()}`,
        name: validated.name,
        nameZh: validated.nameZh,
        email: validated.email || null,
        phone: validated.phone,
        address: validated.address,
        birthday: validated.birthday ? new Date(validated.birthday) : null,
        baptismDate: validated.baptismDate ? new Date(validated.baptismDate) : null,
        memberSince: validated.memberSince ? new Date(validated.memberSince) : new Date(),
        fellowshipGroup: validated.fellowshipGroup,
        ministryAssignments: validated.ministryAssignments || [],
        status: "ACTIVE",
        approvedById: user.id,
        approvedAt: new Date(),
      },
    });

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "CREATE",
      resourceType: "member",
      resourceId: member.id,
      newValues: validated as Record<string, unknown>,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: (error as unknown as { errors: unknown }).errors },
        { status: 400 }
      );
    }
    console.error("Error creating member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
