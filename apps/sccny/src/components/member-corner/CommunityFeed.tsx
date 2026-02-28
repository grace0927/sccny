"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "dark-blue";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

interface PostMember {
  id: string;
  name: string;
  nameZh: string | null;
  profilePhoto: string | null;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  imageFileId: string | null;
  createdAt: string;
  member: PostMember;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CommunityFeedProps {
  currentMemberId: string;
  maxLength: number;
}

export default function CommunityFeed({ currentMemberId, maxLength }: CommunityFeedProps) {
  const t = useTranslations("Community");

  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [content, setContent] = useState("");
  const [pendingImage, setPendingImage] = useState<{ fileId: string; url: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/member/posts?page=${targetPage}&limit=20`);
      if (res.ok) {
        const json = await res.json();
        if (targetPage === 1) {
          setPosts(json.data);
        } else {
          setPosts((prev) => [...prev, ...json.data]);
        }
        setPagination(json.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: t("imageTooLarge") });
      return;
    }

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/member/posts/images", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setPendingImage({ fileId: json.fileId, url: json.url });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || t("imageUploadError") });
        setImagePreview(null);
      }
    } catch {
      setMessage({ type: "error", text: t("imageUploadError") });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    setImagePreview(null);
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting || uploadingImage) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const body: Record<string, string | undefined> = { content: content.trim() };
      if (pendingImage) {
        body.imageFileId = pendingImage.fileId;
        body.imageUrl = pendingImage.url;
      }

      const res = await fetch("/api/member/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts((prev) => [newPost, ...prev]);
        setContent("");
        setPendingImage(null);
        setImagePreview(null);
        setMessage({ type: "success", text: t("postSuccess") });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || t("postError") });
      }
    } catch {
      setMessage({ type: "error", text: t("postError") });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(postId: string) {
    try {
      const res = await fetch(`/api/member/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        setMessage({ type: "success", text: t("deleteSuccess") });
      } else {
        setMessage({ type: "error", text: t("deleteError") });
      }
    } catch {
      setMessage({ type: "error", text: t("deleteError") });
    }
  }

  function loadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  }

  const remaining = maxLength - content.length;
  const isOverLimit = remaining < 0;

  return (
    <div className="space-y-6">
      {/* Composer */}
      <Card>
        <CardHeader>
          <CardTitle>{t("newPost")}</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <p className={`text-sm mb-3 ${message.type === "success" ? "text-green-600" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <textarea
                className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("postPlaceholder")}
                maxLength={maxLength + 50}
              />
              <span className={`absolute bottom-2 right-3 text-xs ${isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {remaining}
              </span>
            </div>

            {imagePreview && (
              <div className="relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={200}
                  height={150}
                  className="rounded-md object-cover max-h-40 w-auto"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  aria-label={t("removeImage")}
                >
                  ×
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                id="community-image-upload"
              />
              <label
                htmlFor="community-image-upload"
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
              >
                {uploadingImage ? "..." : t("addImage")}
              </label>

              <Button
                type="submit"
                size="sm"
                disabled={submitting || !content.trim() || isOverLimit || uploadingImage}
              >
                {submitting ? t("posting") : t("post")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("loading")}</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noPostsYet")}</p>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">
                        {post.member.name}
                        {post.member.nameZh && (
                          <span className="text-muted-foreground font-normal"> ({post.member.nameZh})</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{post.content}</p>
                    {post.imageUrl && (
                      <div className="mt-3">
                        <Image
                          src={post.imageUrl}
                          alt="Post image"
                          width={400}
                          height={300}
                          className="rounded-md object-cover max-h-64 w-auto"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                  {post.member.id === currentMemberId && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      title={t("deletePost")}
                    >
                      {t("deletePost")}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {pagination && pagination.page < pagination.totalPages && (
          <div className="text-center">
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loading}>
              {loading ? "..." : t("loadMore")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
