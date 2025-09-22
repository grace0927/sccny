import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NewsItem } from "./types";
import LoadingStates from "./LoadingStates";
import { format } from "date-fns";

interface NewsDetailProps {
  newsItem: NewsItem | null;
  loading?: boolean;
  error?: string | null;
}

export default function NewsDetail({
  newsItem,
  loading = false,
  error = null,
}: NewsDetailProps) {
  const t = useTranslations("NewsDetail");

  if (loading) {
    return <LoadingStates.NewsDetail />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {t("errorTitle", { defaultValue: "Error Loading News Article" })}
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/news"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {t("backToNews", { defaultValue: "Back to News" })}
          </Link>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      PUBLISHED: "Published",
      DRAFT: "Draft",
      ARCHIVED: "Archived",
    };
    return statusLabels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  {t("home", { defaultValue: "Home" })}
                </Link>
              </li>
              <li>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <Link
                  href="/news"
                  className="text-gray-500 hover:text-gray-700"
                >
                  {t("news", { defaultValue: "News" })}
                </Link>
              </li>
              <li>
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li className="text-gray-900 font-medium truncate">
                {newsItem.title}
              </li>
            </ol>
          </nav>

          {/* Status Badge */}
          <div className="mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {getStatusLabel(newsItem.status)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {newsItem.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(newsItem.date)}
            </div>

            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {t("published", { defaultValue: "Published" })}:{" "}
              {formatDate(newsItem.createdAt)}
            </div>

            {newsItem.updatedAt !== newsItem.createdAt && (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t("updated", { defaultValue: "Updated" })}:{" "}
                {formatDate(newsItem.updatedAt)}
              </div>
            )}
          </div>

          {/* Excerpt */}
          {newsItem.excerpt && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-800 font-medium text-lg leading-relaxed">
                {newsItem.excerpt}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="prose prose-lg max-w-none">
            <div
              className="text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: newsItem.content }}
            />
          </div>
        </div>

        {/* Article Footer */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-500">
              {t("publishedOn", { defaultValue: "Published on" })}:{" "}
              {formatDate(newsItem.createdAt)}
              {newsItem.updatedAt !== newsItem.createdAt && (
                <span className="ml-2">
                  • {t("lastUpdated", { defaultValue: "Last updated" })}:{" "}
                  {formatDate(newsItem.updatedAt)}
                </span>
              )}
            </div>

            {/* Share buttons */}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>
                {t("shareArticle", { defaultValue: "Share this article" })}
              </span>
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
        </div>

        {/* Back to News */}
        <div className="text-center">
          <Link
            href="/news"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t("backToAllNews", { defaultValue: "Back to All News" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
