import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import { deleteFileFromDrive } from "@/lib/google-drive";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const member = await prisma.member.findUnique({ where: { userId: user.id } });
    if (!member || member.status !== "ACTIVE") {
      return NextResponse.json({ error: "Active membership required" }, { status: 403 });
    }

    const { id } = await params;
    const post = await prisma.communityPost.findUnique({ where: { id } });

    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (post.memberId !== member.id) {
      return NextResponse.json({ error: "You can only delete your own posts" }, { status: 403 });
    }

    await prisma.communityPost.delete({ where: { id } });

    if (post.imageFileId) {
      await deleteFileFromDrive(post.imageFileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
