import { z } from "zod";

// Role schemas
export const RoleCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  description: z.string().max(255).optional(),
});

export const RoleUpdateSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(255).optional(),
});

export const RolePermissionsUpdateSchema = z.object({
  permissionIds: z.array(z.string()),
});

export const RoleUserAssignSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

// Audit log query schema
export const GetAuditLogQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val)),
  limit: z
    .string()
    .optional()
    .default("50")
    .transform((val) => Math.min(parseInt(val), 100)),
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type RoleCreateType = z.infer<typeof RoleCreateSchema>;
export type RoleUpdateType = z.infer<typeof RoleUpdateSchema>;
export type GetAuditLogQueryType = z.infer<typeof GetAuditLogQuerySchema>;

// ── Phase 2: User Management ──

export const GetUsersQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val)),
  limit: z.string().optional().default("20").transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const UserInviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  displayName: z.string().min(1, "Display name is required").max(100),
});

export const UserRoleUpdateSchema = z.object({
  roleIds: z.array(z.string()),
});

// ── Phase 2: Member Management ──

export const GetMembersQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val)),
  limit: z.string().optional().default("20").transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "REJECTED"]).optional(),
  fellowshipGroup: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "memberSince"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const MemberCreateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1, "Name is required").max(100),
  nameZh: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  birthday: z.string().optional(),
  baptismDate: z.string().optional(),
  memberSince: z.string().optional(),
  fellowshipGroup: z.string().max(100).optional(),
  ministryAssignments: z.array(z.string()).optional(),
  status: z.enum(["PENDING", "ACTIVE", "INACTIVE", "REJECTED"]).optional(),
});

export const MemberUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameZh: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  birthday: z.string().optional().nullable(),
  baptismDate: z.string().optional().nullable(),
  memberSince: z.string().optional().nullable(),
  fellowshipGroup: z.string().max(100).optional().nullable(),
  ministryAssignments: z.array(z.string()).optional(),
});

export const MemberRejectSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required").max(500),
});

// ── Phase 2: Member Corner ──

export const MemberProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nameZh: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  birthday: z.string().optional().nullable(),
});

export const PrayerRequestCreateSchema = z.object({
  content: z.string().min(1, "Prayer request content is required").max(2000),
  isAnonymous: z.boolean().optional().default(false),
});

// Types
export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>;
export type UserInviteType = z.infer<typeof UserInviteSchema>;
export type UserRoleUpdateType = z.infer<typeof UserRoleUpdateSchema>;
export type GetMembersQueryType = z.infer<typeof GetMembersQuerySchema>;
export type MemberCreateType = z.infer<typeof MemberCreateSchema>;
export type MemberUpdateType = z.infer<typeof MemberUpdateSchema>;
export type MemberRejectType = z.infer<typeof MemberRejectSchema>;
export type MemberProfileUpdateType = z.infer<typeof MemberProfileUpdateSchema>;
export type PrayerRequestCreateType = z.infer<typeof PrayerRequestCreateSchema>;
