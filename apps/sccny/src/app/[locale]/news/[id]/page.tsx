import Link from "next/link";
import { notFound } from "next/navigation";

interface NewsDetailParams {
  params: Promise<{ id: string; locale: string }>;
}

interface NewsItem {
  id: string;
  title: string;
  date: string;
  content: string;
  excerpt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

async function getNewsItem(id: string): Promise<NewsItem | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/news/${id}`;

    const response = await fetch(url, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch news item");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching news item:", error);
    return null;
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
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const item = await getNewsItem(id);

  if (!item) {
    return {
      title: "News Not Found",
      description: "The requested news article could not be found.",
    };
  }

  return {
    title: item.title,
    description: item.excerpt || `Read the full article: ${item.title}`,
  };
}

export default async function NewsDetailPage({ params }: NewsDetailParams) {
  const { id } = await params;
  const item = await getNewsItem(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-8">
          <Link
            href="/news"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to News
          </Link>
        </div>

        {/* Article Header */}
        <header className="mb-8 pb-8 border-b border-gray-200">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {item.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <time className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {formatDate(item.date)}
              </time>

              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
                    clipRule="evenodd"
                  />
                </svg>
                News & Announcement
              </span>
            </div>

            <div className="text-sm text-gray-400">
              Posted on {formatDate(item.createdAt)}
              {item.updatedAt !== item.createdAt && (
                <span className="ml-2">
                  • Updated on {formatDate(item.updatedAt)}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div
            className="text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: item.content }}
          />
        </div>

        {/* Article Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-500">
              Published: {formatDate(item.createdAt)} • Last updated:{" "}
              {formatDate(item.updatedAt)}
            </div>

            {/* Share buttons placeholder - ready for future commenting system */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>Share this article</span>
              <div className="flex space-x-2 ml-2">
                <button
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  aria-label="Facebook"
                  title="Facebook"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" />
                  </svg>
                </button>

                <button
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  aria-label="Twitter"
                  title="Twitter"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11.4678 8.77491L17.2961 2.75H15.915L10.8543 8.1292L6.81232 2.75H2.75L8.80197 11.5286L2.75 17.25H4.13163L9.41032 11.6751L13.6522 17.25H17.7146L11.4675 8.77491H11.4678ZM10.2564 10.8322L9.7318 10.1047L4.69 3.66624H6.32508L10.4547 9.32631L10.9794 10.0538L16.2349 16.7499H14.6001L10.2564 10.8332V10.8322Z" />
                  </svg>
                </button>

                <button
                  className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  aria-label="Copy link"
                  title="Copy link"
                  onClick={() =>
                    navigator.clipboard.writeText(window.location.href)
                  }
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3A2 2 0 019 8.414l3-3z" />
                    <path d="M7.097 12.293a2 2 0 102.828 0l-3-3a2 2 0 00-2.828 0l3 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </footer>

        {/* Related Articles / Navigation */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/news"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            View All News
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
      </article>
    </div>
  );
}
