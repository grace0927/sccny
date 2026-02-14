"use client";

import { createContext, useContext } from "react";

interface PermissionsContextValue {
  permissions: string[];
  hasPermission: (key: string) => boolean;
}

export const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  hasPermission: () => false,
});

export function usePermissions() {
  return useContext(PermissionsContext);
}
