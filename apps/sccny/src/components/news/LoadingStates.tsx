"use client";

const NewsListSkeleton = () => {
  return (
    <div className="space-y-6">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20 ml-4"></div>
            </div>

            <div className="space-y-2 mb-6">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>

            <div className="flex items-center justify-between">
              <div className="h-3 bg-gray-200 rounded w-32"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const NewsCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16 ml-4"></div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded w-28"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
};

const NewsDetailSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Back Button */}
      <div className="mb-8">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>

      {/* Article Header */}
      <header className="mb-8 pb-8 border-b border-gray-200">
        <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </header>

      {/* Article Content */}
      <div className="space-y-4 mb-12">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        ))}
      </div>

      {/* Article Footer */}
      <footer className="pt-8 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="flex space-x-2">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FiltersSkeleton = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full lg:w-48">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full lg:w-48">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full lg:w-40">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full lg:w-32">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

const LoadingStates = {
  NewsList: NewsListSkeleton,
  NewsCard: NewsCardSkeleton,
  NewsDetail: NewsDetailSkeleton,
  Filters: FiltersSkeleton,
};

export default LoadingStates;
