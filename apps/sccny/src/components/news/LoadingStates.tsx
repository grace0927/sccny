"use client";

import { Skeleton, Card, CardContent } from "dark-blue";

const NewsListSkeleton = () => {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-4 w-20 ml-4" />
            </div>

            <div className="space-y-2 mb-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>

            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const NewsCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
          </div>
          <Skeleton className="h-4 w-16 ml-4" />
        </div>

        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
};

const NewsDetailSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="mb-8">
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Article Header */}
      <header className="mb-8 pb-8 border-b border-border">
        <Skeleton className="h-12 w-3/4 mb-6" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </header>

      {/* Article Content */}
      <div className="space-y-4 mb-12">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>

      {/* Article Footer */}
      <footer className="pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FiltersSkeleton = () => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="w-full lg:w-48">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="w-full lg:w-48">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="w-full lg:w-40">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="w-full lg:w-32">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingStates = {
  NewsList: NewsListSkeleton,
  NewsCard: NewsCardSkeleton,
  NewsDetail: NewsDetailSkeleton,
  Filters: FiltersSkeleton,
};

export default LoadingStates;
