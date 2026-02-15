import { prisma } from "@/lib/db";
import { stackServerApp } from "@/stack/server";
import ProfileForm from "@/components/member-corner/ProfileForm";

export default async function ProfilePage() {
  const user = await stackServerApp.getUser();
  if (!user) return null;

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
    name: member.name,
    nameZh: member.nameZh,
    email: member.email,
    phone: member.phone,
    address: member.address,
    birthday: member.birthday ? member.birthday.toISOString().split("T")[0] : null,
  };

  return <ProfileForm member={serialized} />;
}
