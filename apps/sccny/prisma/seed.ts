import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const permissions = [
  // Sermons
  { key: "sermons.view", name: "View Sermons", resource: "sermons", action: "view" },
  { key: "sermons.create", name: "Create Sermons", resource: "sermons", action: "create" },
  { key: "sermons.edit", name: "Edit Sermons", resource: "sermons", action: "edit" },
  { key: "sermons.delete", name: "Delete Sermons", resource: "sermons", action: "delete" },
  { key: "sermons.sync", name: "Sync Sermons", resource: "sermons", action: "sync" },
  // News
  { key: "news.view", name: "View News", resource: "news", action: "view" },
  { key: "news.create", name: "Create News", resource: "news", action: "create" },
  { key: "news.edit", name: "Edit News", resource: "news", action: "edit" },
  { key: "news.delete", name: "Delete News", resource: "news", action: "delete" },
  // Members
  { key: "members.view", name: "View Members", resource: "members", action: "view" },
  { key: "members.create", name: "Create Members", resource: "members", action: "create" },
  { key: "members.edit", name: "Edit Members", resource: "members", action: "edit" },
  { key: "members.approve", name: "Approve Members", resource: "members", action: "approve" },
  { key: "members.deactivate", name: "Deactivate Members", resource: "members", action: "deactivate" },
  { key: "members.export", name: "Export Members", resource: "members", action: "export" },
  { key: "members.import", name: "Import Members", resource: "members", action: "import" },
  // Events
  { key: "events.view", name: "View Events", resource: "events", action: "view" },
  { key: "events.create", name: "Create Events", resource: "events", action: "create" },
  { key: "events.edit", name: "Edit Events", resource: "events", action: "edit" },
  { key: "events.delete", name: "Delete Events", resource: "events", action: "delete" },
  { key: "events.registrations", name: "Manage Event Registrations", resource: "events", action: "registrations" },
  // Announcements
  { key: "announcements.view", name: "View Announcements", resource: "announcements", action: "view" },
  { key: "announcements.create", name: "Create Announcements", resource: "announcements", action: "create" },
  { key: "announcements.edit", name: "Edit Announcements", resource: "announcements", action: "edit" },
  { key: "announcements.delete", name: "Delete Announcements", resource: "announcements", action: "delete" },
  // Content
  { key: "content.view", name: "View Content", resource: "content", action: "view" },
  { key: "content.edit", name: "Edit Content", resource: "content", action: "edit" },
  { key: "content.publish", name: "Publish Content", resource: "content", action: "publish" },
  // Media
  { key: "media.upload", name: "Upload Media", resource: "media", action: "upload" },
  { key: "media.delete", name: "Delete Media", resource: "media", action: "delete" },
  // Users
  { key: "users.view", name: "View Users", resource: "users", action: "view" },
  { key: "users.edit", name: "Edit Users", resource: "users", action: "edit" },
  { key: "users.invite", name: "Invite Users", resource: "users", action: "invite" },
  { key: "users.disable", name: "Disable Users", resource: "users", action: "disable" },
  { key: "users.roles", name: "Manage User Roles", resource: "users", action: "roles" },
  // Roles
  { key: "roles.view", name: "View Roles", resource: "roles", action: "view" },
  { key: "roles.create", name: "Create Roles", resource: "roles", action: "create" },
  { key: "roles.edit", name: "Edit Roles", resource: "roles", action: "edit" },
  { key: "roles.delete", name: "Delete Roles", resource: "roles", action: "delete" },
  { key: "roles.assign", name: "Assign Roles", resource: "roles", action: "assign" },
  // Audit
  { key: "audit.view", name: "View Audit Log", resource: "audit", action: "view" },
  { key: "audit.export", name: "Export Audit Log", resource: "audit", action: "export" },
  // Hymns
  { key: "hymns.view", name: "View Hymns", resource: "hymns", action: "view" },
  { key: "hymns.create", name: "Create Hymns", resource: "hymns", action: "create" },
  { key: "hymns.edit", name: "Edit Hymns", resource: "hymns", action: "edit" },
  { key: "hymns.delete", name: "Delete Hymns", resource: "hymns", action: "delete" },
  // PPT Templates
  { key: "templates.view", name: "View PPT Templates", resource: "templates", action: "view" },
  { key: "templates.create", name: "Create PPT Templates", resource: "templates", action: "create" },
  { key: "templates.edit", name: "Edit PPT Templates", resource: "templates", action: "edit" },
  // PPT / Worship Orders
  { key: "ppt.view", name: "View Worship Orders", resource: "ppt", action: "view" },
  { key: "ppt.create", name: "Create Worship Orders", resource: "ppt", action: "create" },
  { key: "ppt.edit", name: "Edit Worship Orders", resource: "ppt", action: "edit" },
  { key: "ppt.delete", name: "Delete Worship Orders", resource: "ppt", action: "delete" },
  { key: "ppt.generate", name: "Generate PPT", resource: "ppt", action: "generate" },
  // Tools
  { key: "tools.translation.operate", name: "Operate Live Translation", resource: "tools", action: "translation.operate" },
  { key: "tools.ppt.generate", name: "Generate PPT (Tools)", resource: "tools", action: "ppt.generate" },
];

interface RoleDefinition {
  name: string;
  description: string;
  isSystem: boolean;
  permissionKeys: string[];
}

const allPermissionKeys = permissions.map((p) => p.key);

const roles: RoleDefinition[] = [
  {
    name: "SUPER_ADMIN",
    description: "Full access to all features",
    isSystem: true,
    permissionKeys: allPermissionKeys,
  },
  {
    name: "ADMIN",
    description: "Full access except user and role management",
    isSystem: true,
    permissionKeys: allPermissionKeys.filter(
      (k) => !k.startsWith("users.") && !k.startsWith("roles.")
    ),
  },
  {
    name: "PASTOR",
    description: "Sermons, events, announcements, and member view",
    isSystem: true,
    permissionKeys: [
      "sermons.view", "sermons.create", "sermons.edit",
      "events.view", "events.create", "events.edit", "events.registrations",
      "announcements.view", "announcements.create", "announcements.edit",
      "members.view",
      "news.view",
      "audit.view",
    ],
  },
  {
    name: "DEACON",
    description: "Events, announcements, and member view",
    isSystem: true,
    permissionKeys: [
      "events.view", "events.create", "events.edit", "events.registrations",
      "announcements.view", "announcements.create", "announcements.edit",
      "members.view",
      "news.view",
      "audit.view",
    ],
  },
  {
    name: "MEDIA_TEAM",
    description: "Sermons, content, media upload, hymns, and PPT generation",
    isSystem: true,
    permissionKeys: [
      "sermons.view", "sermons.create", "sermons.edit", "sermons.sync",
      "content.view", "content.edit", "content.publish",
      "media.upload", "media.delete",
      "news.view",
      "hymns.view", "hymns.create", "hymns.edit", "hymns.delete",
      "templates.view", "templates.create", "templates.edit",
      "ppt.view", "ppt.create", "ppt.edit", "ppt.delete", "ppt.generate",
      "tools.ppt.generate",
    ],
  },
  {
    name: "MEMBER",
    description: "Member corner access only",
    isSystem: true,
    permissionKeys: [
      "members.view",
    ],
  },
];

async function main() {
  console.log("Seeding permissions...");
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, resource: perm.resource, action: perm.action },
      create: perm,
    });
  }
  console.log(`Seeded ${permissions.length} permissions.`);

  console.log("Seeding roles...");
  for (const roleDef of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description, isSystem: roleDef.isSystem },
      create: { name: roleDef.name, description: roleDef.description, isSystem: roleDef.isSystem },
    });

    // Get permission IDs for this role
    const perms = await prisma.permission.findMany({
      where: { key: { in: roleDef.permissionKeys } },
      select: { id: true },
    });

    // Clear existing role permissions and re-create
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
    });

    console.log(`  Role "${roleDef.name}" with ${perms.length} permissions.`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
