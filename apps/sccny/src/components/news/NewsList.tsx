"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import NewsCard from "./NewsCard";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  status: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NewsListProps {
  limit?: number;
  showPagination?: boolean;
  page?: number;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function NewsList({
  limit = 3,
  showPagination = false,
  page = 1,
}: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError(null);

        const url = showPagination
          ? `/api/news?page=${page}&limit=${limit}&status=PUBLISHED&sortBy=date&sortOrder=desc`
          : `/api/news?page=1&limit=${limit}&status=PUBLISHED&sortBy=date&sortOrder=desc`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        setNews(data.data || []);
        setPagination(data.pagination || null);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError(err instanceof Error ? err.message : "Failed to load news");
        setNews([]);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, [limit, showPagination, page]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: Math.min(limit, 3) }, (_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm mb-2">
          Unable to load news at this time.
        </div>
        <Link
          href="/news"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          View all news →
        </Link>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 text-sm">
          No news available at this time.
        </div>
      </div>
    );
  }

  if (showPagination) {
    return (
      <div className="space-y-8">
        {news.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}

        {/* Pagination controls would go here if needed for detailed listing pages */}
        {pagination && pagination.totalPages > 1 && (
          <div className="text-center">
            <Link href="/news" className="text-blue-600 hover:text-blue-800">
              View all news →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Condensed view for homepage
  return (
    <div className="space-y-6">
      {news.map((item) => (
        <article key={item.id} className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600">
            <Link href={`/news/${item.id}`}>{item.title}</Link>
          </h3>
          <p className="text-sm text-gray-500 mb-2">{formatDate(item.date)}</p>
          {item.excerpt && (
            <p className="text-gray-600 mb-2 line-clamp-2">{item.excerpt}</p>
          )}
          <Link
            href={`/news/${item.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Read More →
          </Link>
        </article>
      ))}

      {news.length > 0 && (
        <div className="text-center pt-4">
          <Link
            href="/news"
            className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-500 hover:text-white transition-colors"
          >
            View All News →
          </Link>
        </div>
      )}
    </div>
  );
}
