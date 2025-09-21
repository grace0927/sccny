"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SermonCardProps } from "./types";
import { format } from "date-fns";

export default function SermonCard({
  sermon,
  showMediaButtons = true,
  compact = false,
}: SermonCardProps) {
  const t = useTranslations("SermonCard");

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const getSermonTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      SERMON: "Sermon",
      SUNDAY_SCHOOL: "Sunday School",
      RETREAT_MESSAGE: "Retreat Message",
      BAPTISM_CLASS: "Baptism Class",
    };
    return typeLabels[type] || type;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-6">
        {/* Sermon Type Badge */}
        <div className="flex justify-between items-start mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {getSermonTypeLabel(sermon.type)}
          </span>
          <span className="text-sm text-gray-500">
            {formatDate(sermon.date)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`font-semibold text-gray-900 mb-2 line-clamp-2 ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {sermon.title}
        </h3>

        {/* Speaker */}
        <p className="text-sm text-gray-600 mb-2">
          <span className="font-medium">Speaker:</span> {sermon.speaker}
        </p>

        {/* Series */}
        {sermon.series && (
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Series:</span> {sermon.series}
          </p>
        )}

        {/* Scripture */}
        {sermon.scripture && (
          <p className="text-sm text-gray-600 mb-3">
            <span className="font-medium">Scripture:</span> {sermon.scripture}
          </p>
        )}

        {/* Description */}
        {sermon.description && !compact && (
          <p className="text-sm text-gray-700 line-clamp-3 mb-4">
            {sermon.description}
          </p>
        )}
      </div>

      {/* Media Buttons */}
      {showMediaButtons && (
        <div className="px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {sermon.videoUrl && (
              <button
                onClick={() => window.open(sermon.videoUrl!, "_blank")}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                Watch Video
              </button>
            )}

            {sermon.audioUrl && (
              <button
                onClick={() => window.open(sermon.audioUrl!, "_blank")}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M18 3a1 1 0 00-1.196-.98L9 3.73V6a1 1 0 000 2v4a1 1 0 001 1h6a1 1 0 001-1V3zM8 10a1 1 0 00-1-1H1a1 1 0 000 2h6a1 1 0 001-1z" />
                  <path d="M16 12a1 1 0 011 1v2a1 1 0 01-1 1H7a1 1 0 01-1-1v-2a1 1 0 011-1h9z" />
                </svg>
                Listen Audio
              </button>
            )}

            <Link
              href={`/messages/sermon-recordings/${sermon.id}`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              View Details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
