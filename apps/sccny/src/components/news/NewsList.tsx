"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NewsListProps, NewsItem } from "./types";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function NewsList({
  initialNews = [],
  showFilters = false,
  limit = 20,
}: NewsListProps) {
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if we don't have initial news
    if (initialNews.length === 0) {
      const fetchNews = async () => {
        try {
          setLoading(true);
          setError(null);

          const queryParams = new URLSearchParams({
            page: "1",
            limit: limit.toString(),
            sortBy: "date",
            sortOrder: "desc",
            status: "PUBLISHED",
          });

          const response = await fetch(`/api/news?${queryParams}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setNews(data.data || []);
        } catch (err) {
          console.error("Error fetching news:", err);
          setError(err instanceof Error ? err.message : "Failed to load news");
          setNews([]);
        } finally {
          setLoading(false);
        }
      };

      fetchNews();
    }
  }, [limit, initialNews.length]);

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

  // For homepage/preview mode (no filters)
  if (!showFilters) {
    return (
      <div className="space-y-6">
        {news.map((item) => (
          <article key={item.id} className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 hover:text-blue-600">
              <Link href={`/news/${item.id}`}>{item.title}</Link>
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {formatDate(item.date)}
            </p>
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

  // For full news page (with pagination but no filters)
  return (
    <div className="space-y-8">
      {news.map((item) => (
        <article
          key={item.id}
          className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                <Link href={`/news/${item.id}`}>{item.title}</Link>
              </h2>
              <time className="text-sm text-gray-500 shrink-0 ml-4">
                {formatDate(item.date)}
              </time>
            </div>

            {item.excerpt && (
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                {item.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between">
              <time className="text-sm text-gray-400">
                Posted on {formatDate(item.createdAt)}
              </time>
              <Link
                href={`/news/${item.id}`}
                className="inline-flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-500 hover:text-white transition-colors duration-200"
              >
                Read More
                <svg
                  className="w-4 h-4 ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </article>
      ))}

      {news.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No news found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            News articles will appear here once they are published.
          </p>
        </div>
      )}
    </div>
  );
}
