"use client";

import { ReactNode, useMemo } from "react";
import { PermissionsContext } from "@/lib/permissions-client";

interface PermissionsProviderProps {
  permissions: string[];
  children: ReactNode;
}

export default function PermissionsProvider({
  permissions,
  children,
}: PermissionsProviderProps) {
  const value = useMemo(
    () => ({
      permissions,
      hasPermission: (key: string) => permissions.includes(key),
    }),
    [permissions]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}
