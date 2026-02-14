"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, Button, Input, Select } from "dark-blue";
import StatusBadge from "./StatusBadge";
import { usePermissions } from "@/lib/permissions-client";
import { format } from "date-fns";

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditLogViewer() {
  const t = useTranslations("AuditLog");
  const { hasPermission } = usePermissions();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  const fetchLogs = useCallback(async (page: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resourceType", resourceFilter);

    const res = await fetch(`/api/admin/audit-log?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.data);
      setPagination(data.pagination);
    }
    setLoading(false);
  }, [actionFilter, resourceFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-40"
        >
          <option value="">{t("allActions")}</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
          <option value="LOGIN">LOGIN</option>
          <option value="EXPORT">EXPORT</option>
          <option value="SYNC">SYNC</option>
        </Select>

        <Input
          placeholder={t("filterResource")}
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="w-40"
        />

        {hasPermission("audit.export") && (
          <Button
            variant="outline"
            onClick={() => {
              const params = new URLSearchParams();
              if (actionFilter) params.set("action", actionFilter);
              if (resourceFilter) params.set("resourceType", resourceFilter);
              window.open(`/api/admin/audit-log/export?${params}`, "_blank");
            }}
          >
            {t("export")}
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("loading")}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {t("noLogs")}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    {t("time")}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    {t("user")}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    {t("action")}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    {t("resource")}
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                    {t("details")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        setExpandedId(expandedId === log.id ? null : log.id)
                      }
                    >
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {log.userName}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={log.action} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {log.resourceType}
                        {log.resourceId && (
                          <span className="text-xs ml-1">
                            #{log.resourceId.slice(0, 8)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {expandedId === log.id ? "▼" : "▶"}
                      </td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={5} className="p-4 bg-muted/30">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {log.oldValues && (
                              <div>
                                <p className="font-semibold text-foreground mb-1">
                                  {t("oldValues")}
                                </p>
                                <pre className="bg-card p-2 rounded overflow-auto max-h-48">
                                  {JSON.stringify(log.oldValues, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValues && (
                              <div>
                                <p className="font-semibold text-foreground mb-1">
                                  {t("newValues")}
                                </p>
                                <pre className="bg-card p-2 rounded overflow-auto max-h-48">
                                  {JSON.stringify(log.newValues, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t("page")} {pagination.page} / {pagination.totalPages} ({pagination.total} {t("total")})
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              {t("previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              {t("next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
