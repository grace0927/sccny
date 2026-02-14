"use client";

import { Badge } from "dark-blue";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-success/10 text-success border-success/20",
  DRAFT: "bg-muted text-muted-foreground border-muted",
  PUBLISHED: "bg-success/10 text-success border-success/20",
  ARCHIVED: "bg-warning/10 text-warning border-warning/20",
  CREATE: "bg-success/10 text-success border-success/20",
  UPDATE: "bg-info/10 text-info border-info/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  LOGIN: "bg-primary/10 text-primary border-primary/20",
  EXPORT: "bg-warning/10 text-warning border-warning/20",
  SYNC: "bg-info/10 text-info border-info/20",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(statusStyles[status] || "bg-muted text-muted-foreground", className)}
    >
      {status}
    </Badge>
  );
}
