import { notFound } from "next/navigation";
import Link from "next/link";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  status: string;
  createdAt: string;
}

interface NewsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getNews(page: number = 1, limit: number = 20) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/news?page=${page}&limit=${limit}&status=PUBLISHED&sortBy=date&sortOrder=desc`;

    const response = await fetch(url, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      throw new Error("Failed to fetch news");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching news:", error);
    return { data: [], pagination: { total: 0, totalPages: 0 } };
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await import(`@/messages/${locale}.json`).then((m) => m.default);

  return {
    title: t.news?.title || "News & Announcements",
    description:
      t.news?.description ||
      "Stay updated with the latest news from our church community.",
  };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const searchParamsResolved = await searchParams;
  const page = parseInt(searchParamsResolved.page as string) || 1;
  const limit = parseInt(searchParamsResolved.limit as string) || 20;

  const newsResult = await getNews(page, limit);

  if (!newsResult) {
    notFound();
  }

  const { data: news, pagination } = newsResult;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            News & Announcements
          </h1>
          <p className="text-lg text-gray-600">
            Stay updated with the latest news from our church community.
          </p>
        </div>

        {/* News List */}
        {news.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg">
              No news available at this time.
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {news.map((item: NewsItem) => (
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
                      {formatDate(item.createdAt)} • Posted on{" "}
                      {formatDate(item.createdAt)}
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
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex items-center space-x-2">
              {/* Previous Button */}
              {page > 1 && (
                <Link
                  href={{ query: { page: page - 1 } }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Previous
                </Link>
              )}

              {/* Page Numbers */}
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (page <= 3) {
                    pageNumber = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = page - 2 + i;
                  }

                  return (
                    <Link
                      key={pageNumber}
                      href={{ query: { page: pageNumber } }}
                      className={`px-3 py-2 border rounded-md transition-colors ${
                        pageNumber === page
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                }
              )}

              {/* Next Button */}
              {page < pagination.totalPages && (
                <Link
                  href={{ query: { page: page + 1 } }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                >
                  Next
                </Link>
              )}
            </nav>
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
