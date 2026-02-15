"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, Label } from "dark-blue";
import { useState, useEffect } from "react";

interface PrayerRequest {
  id: string;
  content: string;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
}

export default function PrayerRequests() {
  const t = useTranslations("MemberCorner");
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchRequests() {
    try {
      const res = await fetch("/api/member/me/prayer-requests");
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/member/me/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isAnonymous }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: t("prayerRequestForm.success") });
        setContent("");
        setIsAnonymous(false);
        fetchRequests();
      } else {
        setMessage({ type: "error", text: t("prayerRequestForm.error") });
      }
    } catch {
      setMessage({ type: "error", text: t("prayerRequestForm.error") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Submit Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("prayerRequestForm.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <p className={`text-sm mb-4 ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("prayerRequestForm.contentPlaceholder")}
              required
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-foreground">{t("prayerRequestForm.anonymous")}</span>
            </label>
            <Button type="submit" disabled={submitting || !content.trim()}>
              {submitting ? t("prayerRequestForm.submitting") : t("prayerRequestForm.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("prayerRequestList.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("prayerRequestList.empty")}</p>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 border border-border rounded-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <Badge variant={req.status === "PRAYED" ? "default" : "subtle"}>
                      {req.status === "PRAYED" ? t("prayerRequestList.statusPrayed") : t("prayerRequestList.statusPending")}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{req.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
