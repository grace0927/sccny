import NewsDetail from "@/components/news/NewsDetail";
import { NewsItem } from "@/components/news/types";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

async function getNewsItem(id: string): Promise<NewsItem | null> {
  try {
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/news/${id}`,
      {
        cache: "force-cache", // Enable static generation for SEO
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch news item: ${response.status}`);
    }

    const newsItem: NewsItem = await response.json();
    return newsItem;
  } catch (error) {
    console.error("Error fetching news item:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const newsItem = await getNewsItem(id);

  if (!newsItem) {
    return {
      title: "News Article Not Found",
    };
  }

  return {
    title: `${newsItem.title} | SCCNY News`,
    description: newsItem.excerpt || `Read the full article: ${newsItem.title}`,
    openGraph: {
      title: newsItem.title,
      description:
        newsItem.excerpt || `Read the full article: ${newsItem.title}`,
      type: "article",
      publishedTime: newsItem.createdAt,
      modifiedTime: newsItem.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: newsItem.title,
      description:
        newsItem.excerpt || `Read the full article: ${newsItem.title}`,
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { id } = await params;
  const newsItem = await getNewsItem(id);

  return <NewsDetail newsItem={newsItem} />;
}
