import "server-only";
import { prisma } from "@/lib/db";

interface AuditLogInput {
  userId: string;
  userName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT" | "SYNC";
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAction(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        oldValues: input.oldValues as Record<string, string | number | boolean | null> | undefined,
        newValues: input.newValues as Record<string, string | number | boolean | null> | undefined,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  } catch (error) {
    // Audit logging should not break the main operation
    console.error("Failed to write audit log:", error);
  }
}
