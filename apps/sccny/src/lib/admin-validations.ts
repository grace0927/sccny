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
  memberStatus: z.enum(["PENDING", "ACTIVE", "INACTIVE", "REJECTED"]).optional(),
  sortBy: z.enum(["displayName", "email", "createdAt"]).optional().default("createdAt"),
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

export const MemberApproveSchema = z.object({
  fellowshipGroup: z.string().max(100).optional(),
});

export const MemberRejectSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required").max(500),
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

// ── Phase 3: Sermon Management (Admin) ──

export const GetAdminSermonsQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val)),
  limit: z.string().optional().default("20").transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  speaker: z.string().optional(),
  series: z.string().optional(),
  type: z.enum(["SERMON", "SUNDAY_SCHOOL", "RETREAT_MESSAGE", "BAPTISM_CLASS"]).optional(),
  sortBy: z.enum(["date", "title", "speaker", "createdAt"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const SermonAdminCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  speaker: z.string().min(1, "Speaker is required").max(200),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["SERMON", "SUNDAY_SCHOOL", "RETREAT_MESSAGE", "BAPTISM_CLASS"]).optional().default("SERMON"),
  series: z.string().max(200).optional(),
  scripture: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  videoUrl: z.string().url().optional().or(z.literal("")),
  audioUrl: z.string().url().optional().or(z.literal("")),
});

export const SermonAdminUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  speaker: z.string().min(1).max(200).optional(),
  date: z.string().optional(),
  type: z.enum(["SERMON", "SUNDAY_SCHOOL", "RETREAT_MESSAGE", "BAPTISM_CLASS"]).optional(),
  series: z.string().max(200).optional().nullable(),
  scripture: z.string().max(500).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  videoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  audioUrl: z.string().url().optional().or(z.literal("")).nullable(),
});

export const SermonBulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
  action: z.enum(["delete", "changeType"]),
  type: z.enum(["SERMON", "SUNDAY_SCHOOL", "RETREAT_MESSAGE", "BAPTISM_CLASS"]).optional(),
});

// ── Phase 3: Announcement Management ──

export const GetAnnouncementsQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val)),
  limit: z.string().optional().default("20").transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional(),
  sortBy: z.enum(["startDate", "priority", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const AnnouncementCreateSchema = z.object({
  titleEn: z.string().min(1, "English title is required").max(500),
  titleZh: z.string().min(1, "Chinese title is required").max(500),
  contentEn: z.string().min(1, "English content is required"),
  contentZh: z.string().min(1, "Chinese content is required"),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional().default("NORMAL"),
  audience: z.enum(["ALL", "MEMBERS_ONLY"]).optional().default("ALL"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isPinned: z.boolean().optional().default(false),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional().default("DRAFT"),
});

export const AnnouncementUpdateSchema = z.object({
  titleEn: z.string().min(1).max(500).optional(),
  titleZh: z.string().min(1).max(500).optional(),
  contentEn: z.string().min(1).optional(),
  contentZh: z.string().min(1).optional(),
  priority: z.enum(["NORMAL", "IMPORTANT", "URGENT"]).optional(),
  audience: z.enum(["ALL", "MEMBERS_ONLY"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isPinned: z.boolean().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

// ── Phase 3: Event Management ──

export const GetEventsQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val)),
  limit: z.string().optional().default("20").transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  type: z.enum(["WORSHIP", "FELLOWSHIP", "RETREAT", "CONFERENCE", "HOLIDAY", "OTHER"]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(["startDate", "title", "createdAt"]).optional().default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const EventCreateSchema = z.object({
  titleEn: z.string().min(1, "English title is required").max(500),
  titleZh: z.string().min(1, "Chinese title is required").max(500),
  descriptionEn: z.string().max(10000).optional(),
  descriptionZh: z.string().max(10000).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().max(500).optional(),
  type: z.enum(["WORSHIP", "FELLOWSHIP", "RETREAT", "CONFERENCE", "HOLIDAY", "OTHER"]).optional().default("OTHER"),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().max(500).optional(),
  registrationUrl: z.string().url().optional().or(z.literal("")),
  coverImage: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]).optional().default("DRAFT"),
});

export const EventUpdateSchema = z.object({
  titleEn: z.string().min(1).max(500).optional(),
  titleZh: z.string().min(1).max(500).optional(),
  descriptionEn: z.string().max(10000).optional().nullable(),
  descriptionZh: z.string().max(10000).optional().nullable(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(500).optional().nullable(),
  type: z.enum(["WORSHIP", "FELLOWSHIP", "RETREAT", "CONFERENCE", "HOLIDAY", "OTHER"]).optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().max(500).optional().nullable(),
  registrationUrl: z.string().url().optional().or(z.literal("")).nullable(),
  coverImage: z.string().url().optional().or(z.literal("")).nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"]).optional(),
});

export const EventRegistrationCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  memberId: z.string().optional(),
});

// ── Phase 3: Content Management (CMS) ──

export const GetContentPagesQuerySchema = z.object({
  page: z.string().optional().default("1").transform((val) => parseInt(val)),
  limit: z.string().optional().default("20").transform((val) => Math.min(parseInt(val), 100)),
  search: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  sortBy: z.enum(["slug", "updatedAt", "createdAt"]).optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const ContentPageCreateSchema = z.object({
  slug: z.string().min(1, "Slug is required").max(200).regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  titleEn: z.string().min(1, "English title is required").max(500),
  titleZh: z.string().min(1, "Chinese title is required").max(500),
  contentEn: z.string().min(1, "English content is required"),
  contentZh: z.string().min(1, "Chinese content is required"),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
});

export const ContentPageUpdateSchema = z.object({
  titleEn: z.string().min(1).max(500).optional(),
  titleZh: z.string().min(1).max(500).optional(),
  contentEn: z.string().min(1).optional(),
  contentZh: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

// Types
export type GetAdminSermonsQueryType = z.infer<typeof GetAdminSermonsQuerySchema>;
export type SermonAdminCreateType = z.infer<typeof SermonAdminCreateSchema>;
export type SermonAdminUpdateType = z.infer<typeof SermonAdminUpdateSchema>;
export type GetAnnouncementsQueryType = z.infer<typeof GetAnnouncementsQuerySchema>;
export type AnnouncementCreateType = z.infer<typeof AnnouncementCreateSchema>;
export type AnnouncementUpdateType = z.infer<typeof AnnouncementUpdateSchema>;
export type GetEventsQueryType = z.infer<typeof GetEventsQuerySchema>;
export type EventCreateType = z.infer<typeof EventCreateSchema>;
export type EventUpdateType = z.infer<typeof EventUpdateSchema>;
export type GetContentPagesQueryType = z.infer<typeof GetContentPagesQuerySchema>;
export type ContentPageCreateType = z.infer<typeof ContentPageCreateSchema>;
export type ContentPageUpdateType = z.infer<typeof ContentPageUpdateSchema>;

export type GetUsersQueryType = z.infer<typeof GetUsersQuerySchema>;
export type UserInviteType = z.infer<typeof UserInviteSchema>;
export type UserRoleUpdateType = z.infer<typeof UserRoleUpdateSchema>;
export type GetMembersQueryType = z.infer<typeof GetMembersQuerySchema>;
export type MemberCreateType = z.infer<typeof MemberCreateSchema>;
export type MemberUpdateType = z.infer<typeof MemberUpdateSchema>;
export type MemberRejectType = z.infer<typeof MemberRejectSchema>;
export type MemberProfileUpdateType = z.infer<typeof MemberProfileUpdateSchema>;
export type PrayerRequestCreateType = z.infer<typeof PrayerRequestCreateSchema>;
