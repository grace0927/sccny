"use client";

import { useTranslations } from "next-intl";

interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

interface PermissionMatrixProps {
  allPermissions: Permission[];
  selectedIds: Set<string>;
  onToggle: (permissionId: string) => void;
  disabled?: boolean;
}

export default function PermissionMatrix({
  allPermissions,
  selectedIds,
  onToggle,
  disabled = false,
}: PermissionMatrixProps) {
  const t = useTranslations("RoleManagement");

  // Group permissions by resource
  const grouped = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) acc[perm.resource] = [];
      acc[perm.resource].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([resource, perms]) => (
        <div key={resource}>
          <h4 className="text-sm font-semibold text-foreground capitalize mb-2">
            {resource}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {perms.map((perm) => (
              <label
                key={perm.id}
                className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(perm.id)}
                  onChange={() => onToggle(perm.id)}
                  disabled={disabled}
                  className="rounded border-border"
                />
                <span>{perm.name}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {allPermissions.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("noPermissions")}</p>
      )}
    </div>
  );
}
