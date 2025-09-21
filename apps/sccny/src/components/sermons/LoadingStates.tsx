import React from "react";

const SermonCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md animate-pulse overflow-hidden">
    <div className="p-6">
      <div className="flex justify-between items-start mb-3">
        <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>

      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>

      <div className="h-4 w-1/2 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-3"></div>

      <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
      <div className="h-4 w-5/6 bg-gray-200 rounded mb-1"></div>
      <div className="h-4 w-4/5 bg-gray-200 rounded mb-4"></div>
    </div>

    <div className="px-6 pb-6">
      <div className="flex flex-wrap gap-2">
        <div className="h-9 w-24 bg-gray-200 rounded-md"></div>
        <div className="h-9 w-28 bg-gray-200 rounded-md"></div>
        <div className="h-9 w-32 bg-gray-200 rounded-md"></div>
      </div>
    </div>
  </div>
);

const SermonList = () => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <SermonCardSkeleton key={index} />
    ))}
  </div>
);

const MediaPlayerSkeleton = () => (
  <div className="bg-gray-100 rounded-lg p-8 animate-pulse">
    <div className="flex items-center justify-center h-64 bg-gray-200 rounded">
      <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-4 w-3/4 bg-gray-200 rounded mx-auto"></div>
      <div className="h-3 w-1/2 bg-gray-200 rounded mx-auto"></div>
    </div>
  </div>
);

const SermonDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="mb-8">
      <div className="h-8 w-3/4 bg-gray-200 rounded mb-2"></div>
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-4"></div>
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
    </div>

    <MediaPlayerSkeleton />

    <div className="mt-8 space-y-4">
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-full bg-gray-200 rounded"></div>
      <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
      <div className="h-4 w-4/5 bg-gray-200 rounded"></div>
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
