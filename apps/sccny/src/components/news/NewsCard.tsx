"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, Button } from "dark-blue";

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
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            <Link href={`/news/${item.id}`}>{item.title}</Link>
          </h3>
          <time className="text-sm text-muted-foreground shrink-0 ml-4">
            {formatDate(item.date)}
          </time>
        </div>

        {item.excerpt && (
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            {item.excerpt}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <time className="text-sm text-muted-foreground">
          Posted on {formatDate(item.createdAt)}
        </time>
        <Button variant="outline" asChild>
          <Link href={`/news/${item.id}`}>
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
        </Button>
      </CardFooter>
    </Card>
  );
}
