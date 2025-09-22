"use client";

import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  status: string;
  createdAt: string;
}

interface NewsCardProps {
  item: NewsItem;
  className?: string;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function NewsCard({ item, className = "" }: NewsCardProps) {
  return (
    <article
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden ${className}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
            <Link href={`/news/${item.id}`}>{item.title}</Link>
          </h3>
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
  );
}
