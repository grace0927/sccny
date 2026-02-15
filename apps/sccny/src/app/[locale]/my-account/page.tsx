import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import MemberDashboard from "@/components/member-corner/MemberDashboard";

export default async function MyAccountPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null;

  // Lazy creation: auto-create Member record if it doesn't exist
  let member = await prisma.member.findUnique({
    where: { userId: user.id },
  });

  if (!member) {
    member = await prisma.member.create({
      data: {
        userId: user.id,
        name: user.displayName || user.primaryEmail || "Unknown",
        email: user.primaryEmail || undefined,
        status: "PENDING",
      },
    });
  }

  const serialized = {
    id: member.id,
    name: member.name,
    nameZh: member.nameZh,
    status: member.status,
    rejectionReason: member.rejectionReason,
    fellowshipGroup: member.fellowshipGroup,
    ministryAssignments: member.ministryAssignments,
    memberSince: member.memberSince?.toISOString() || null,
  };

  return <MemberDashboard member={serialized} />;
}
