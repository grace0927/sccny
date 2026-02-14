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
