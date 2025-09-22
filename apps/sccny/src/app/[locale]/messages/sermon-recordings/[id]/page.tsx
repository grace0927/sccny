import SermonDetail from "@/components/sermons/SermonDetail";
import { Sermon } from "@/components/sermons/types";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

async function getSermon(id: string): Promise<Sermon | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/sermons/${id}`,
      {
        cache: "force-cache", // Enable static generation for SEO
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch sermon: ${response.status}`);
    }

    const sermon: Sermon = await response.json();
    return sermon;
  } catch (error) {
    console.error("Error fetching sermon:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const sermon = await getSermon(id);

  if (!sermon) {
    return {
      title: "Sermon Not Found",
    };
  }

  return {
    title: `${sermon.title} | SCCNY Messages`,
    description:
      sermon.description || `Listen to "${sermon.title}" by ${sermon.speaker}`,
    openGraph: {
      title: sermon.title,
      description:
        sermon.description ||
        `Listen to "${sermon.title}" by ${sermon.speaker}`,
      type: "video.other",
      ...(sermon.videoUrl && { video: sermon.videoUrl }),
      ...(sermon.audioUrl && { audio: sermon.audioUrl }),
    },
    twitter: {
      card: "summary_large_image",
      title: sermon.title,
      description:
        sermon.description ||
        `Listen to "${sermon.title}" by ${sermon.speaker}`,
    },
  };
}

export default async function SermonDetailPage({ params }: PageProps) {
  const { id } = await params;
  const sermon = await getSermon(id);

  return <SermonDetail sermon={sermon} />;
}
