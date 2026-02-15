import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { stackServerApp } from "@/stack/server";
import { GetUsersQuerySchema } from "@/lib/admin-validations";

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "users.view");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { page, limit, search, memberStatus, sortBy, sortOrder } = GetUsersQuerySchema.parse(searchParams);

    // Get users from Stack Auth
    const stackUsers = await stackServerApp.listUsers();

    // Get all members for status lookup
    const members = await prisma.member.findMany({
      select: { userId: true, status: true },
    });
    const memberMap = new Map(members.map((m) => [m.userId, m.status]));

    // Get all user roles for role lookup
    const userRoles = await prisma.userRole.findMany({
      include: { role: { select: { id: true, name: true } } },
    });
    const roleMap = new Map<string, { id: string; name: string }[]>();
    for (const ur of userRoles) {
      const existing = roleMap.get(ur.userId) || [];
      existing.push(ur.role);
      roleMap.set(ur.userId, existing);
    }

    // Combine and filter
    let combined = stackUsers.map((su) => ({
      id: su.id,
      displayName: su.displayName,
      primaryEmail: su.primaryEmail,
      createdAt: su.signedUpAt ? su.signedUpAt.toISOString() : null,
      memberStatus: memberMap.get(su.id) || null,
      roles: roleMap.get(su.id) || [],
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      combined = combined.filter(
        (u) =>
          (u.displayName && u.displayName.toLowerCase().includes(searchLower)) ||
          (u.primaryEmail && u.primaryEmail.toLowerCase().includes(searchLower))
      );
    }

    // Apply member status filter
    if (memberStatus) {
      combined = combined.filter((u) => u.memberStatus === memberStatus);
    }

    // Sort
    combined.sort((a, b) => {
      let aVal: string | null = null;
      let bVal: string | null = null;
      if (sortBy === "displayName") {
        aVal = a.displayName;
        bVal = b.displayName;
      } else if (sortBy === "email") {
        aVal = a.primaryEmail;
        bVal = b.primaryEmail;
      } else {
        aVal = a.createdAt;
        bVal = b.createdAt;
      }
      const cmp = (aVal || "").localeCompare(bVal || "");
      return sortOrder === "asc" ? cmp : -cmp;
    });

    const total = combined.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = combined.slice(start, start + limit);

    return NextResponse.json({
      data,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
