import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminUser, unauthorizedResponse, forbiddenResponse } from "@/lib/admin-auth";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAction } from "@/lib/audit";
import { deleteFileFromDrive } from "@/lib/google-drive";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser();
    if (!user) return unauthorizedResponse();

    await requirePermission(user.id, "community.manage");

    const { id } = await params;
    const post = await prisma.communityPost.findUnique({
      where: { id },
      include: { member: { select: { name: true } } },
    });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    await prisma.communityPost.delete({ where: { id } });

    if (post.imageFileId) {
      await deleteFileFromDrive(post.imageFileId);
    }

    await logAction({
      userId: user.id,
      userName: user.displayName || user.primaryEmail || "Unknown",
      action: "DELETE",
      resourceType: "community_post",
      resourceId: id,
      oldValues: {
        memberId: post.memberId,
        memberName: post.member.name,
        content: post.content,
      },
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) return forbiddenResponse();
    console.error("Error deleting community post (admin):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
