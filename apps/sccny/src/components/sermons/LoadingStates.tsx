import React from "react";
import { Skeleton, Card, CardContent, CardHeader, CardFooter } from "dark-blue";

const SermonCardSkeleton = () => (
  <Card className="overflow-hidden">
    <CardHeader>
      <div className="flex justify-between items-start mb-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>

    <CardContent>
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/3 mb-2" />
      <Skeleton className="h-4 w-2/3 mb-3" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-1" />
      <Skeleton className="h-4 w-4/5" />
    </CardContent>

    <CardFooter>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
    </CardFooter>
  </Card>
);

const SermonList = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <SermonCardSkeleton key={index} />
    ))}
  </div>
);

const MediaPlayerSkeleton = () => (
  <Card>
    <CardContent className="pt-6">
      <Skeleton className="h-64 w-full rounded" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
      </div>
    </CardContent>
  </Card>
);

const SermonDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="mb-8">
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2 mb-4" />
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>

    <MediaPlayerSkeleton />

    <div className="mt-8 space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </div>
);

const LoadingStates = {
  SermonList,
  SermonCardSkeleton,
  MediaPlayerSkeleton,
  SermonDetailSkeleton,
};

export default LoadingStates;
