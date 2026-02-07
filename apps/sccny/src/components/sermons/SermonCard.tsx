"use client";

import { Link } from "@/i18n/navigation";
import { SermonCardProps } from "./types";
import { format } from "date-fns";
import { Card, CardHeader, CardContent, CardFooter, Badge, Button } from "dark-blue";

export default function SermonCard({
  sermon,
  showMediaButtons = true,
  compact = false,
}: SermonCardProps) {
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
    <Card className="hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Card Header */}
      <CardHeader>
        {/* Sermon Type Badge */}
        <div className="flex justify-between items-start">
          <Badge variant="subtle">
            {getSermonTypeLabel(sermon.type)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {formatDate(sermon.date)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`font-semibold text-foreground line-clamp-2 ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {sermon.title}
        </h3>
      </CardHeader>

      <CardContent>
        {/* Speaker */}
        <p className="text-sm text-muted-foreground mb-2">
          <span className="font-medium">Speaker:</span> {sermon.speaker}
        </p>

        {/* Series */}
        {sermon.series && (
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">Series:</span> {sermon.series}
          </p>
        )}

        {/* Scripture */}
        {sermon.scripture && (
          <p className="text-sm text-muted-foreground mb-3">
            <span className="font-medium">Scripture:</span> {sermon.scripture}
          </p>
        )}

        {/* Description */}
        {sermon.description && !compact && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {sermon.description}
          </p>
        )}
      </CardContent>

      {/* Media Buttons */}
      {showMediaButtons && (
        <CardFooter>
          <div className="flex flex-wrap gap-2">
            {sermon.videoUrl && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => window.open(sermon.videoUrl!, "_blank")}
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
              </Button>
            )}

            {sermon.audioUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(sermon.audioUrl!, "_blank")}
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
              </Button>
            )}

            <Button variant="outline" size="sm" asChild>
              <Link href={`/messages/sermon-recordings/${sermon.id}`}>
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
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
