import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Sermon } from "./types";
import MediaPlayer from "./MediaPlayer";
import LoadingStates from "./LoadingStates";
import { format } from "date-fns";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Badge,
  Button,
  Card,
  CardContent,
} from "dark-blue";

interface SermonDetailProps {
  sermon: Sermon | null;
  loading?: boolean;
  error?: string | null;
}

export default function SermonDetail({
  sermon,
  loading = false,
  error = null,
}: SermonDetailProps) {
  const t = useTranslations("SermonDetail");

  if (loading) {
    return <LoadingStates.SermonDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {t("errorTitle", { defaultValue: "Error Loading Sermon" })}
          </h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button asChild>
            <Link href="/messages/sermon-recordings">
              {t("backToSermons", { defaultValue: "Back to Sermons" })}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!sermon) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/messages">
                  {t("messages", { defaultValue: "Messages" })}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/messages/sermon-recordings">
                  {t("sermonRecordings", { defaultValue: "Sermon Recordings" })}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{sermon.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Sermon Type Badge */}
          <div className="mb-4">
            <Badge variant="subtle">
              {getSermonTypeLabel(sermon.type)}
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {sermon.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {t("speaker", { defaultValue: "Speaker" })}: {sermon.speaker}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(sermon.date)}
            </div>

            {sermon.series && (
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                {t("series", { defaultValue: "Series" })}: {sermon.series}
              </div>
            )}

            {sermon.scripture && (
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
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                {sermon.scripture}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Media Player */}
        <div className="mb-8">
          <MediaPlayer
            videoUrl={sermon.videoUrl || undefined}
            audioUrl={sermon.audioUrl || undefined}
            title={sermon.title}
          />
        </div>

        {/* Description */}
        {sermon.description && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                {t("aboutThisSermon", { defaultValue: "About This Sermon" })}
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-muted-foreground whitespace-pre-line">
                  {sermon.description}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Sermons */}
        <div className="text-center">
          <Button asChild>
            <Link href="/messages/sermon-recordings">
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
              {t("backToAllSermons", { defaultValue: "Back to All Sermons" })}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
