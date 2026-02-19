import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const superAdmin = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!superAdmin) {
    console.error("SUPER_ADMIN role not found. Run seed first.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log(`Found ${users.length} users`);

  const existing = await prisma.userRole.findMany({
    where: { roleId: superAdmin.id },
    select: { userId: true },
  });
  const existingUserIds = new Set(existing.map((e) => e.userId));

  let created = 0;
  for (const user of users) {
    if (!existingUserIds.has(user.id)) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: superAdmin.id },
      });
      console.log(`  Assigned SUPER_ADMIN to ${user.email || user.id}`);
      created++;
    } else {
      console.log(`  ${user.email || user.id} already has SUPER_ADMIN`);
    }
  }
  console.log(`Done. Assigned SUPER_ADMIN to ${created} new users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
