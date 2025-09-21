"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  SermonListProps,
  Sermon,
  SermonsResponse,
  SermonFilters as SermonFiltersType,
} from "./types";
import SermonCard from "./SermonCard";
import SermonFiltersComponent from "./SermonFilters";
import Pagination from "./SermonPagination";
import LoadingStates from "./LoadingStates";

export default function SermonList({
  initialSermons = [],
  type,
  showFilters = true,
}: SermonListProps) {
  const t = useTranslations("SermonList");
  const [sermons, setSermons] = useState<Sermon[]>(initialSermons);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<SermonFiltersType>({
    sortBy: "date",
    sortOrder: "desc",
    ...(type && { type }),
  });

  const fetchSermons = async (
    page: number = 1,
    currentFilters: SermonFiltersType = filters
  ) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy: currentFilters.sortBy || "date",
        sortOrder: currentFilters.sortOrder || "desc",
        ...(currentFilters.speaker && { speaker: currentFilters.speaker }),
        ...(currentFilters.series && { series: currentFilters.series }),
        ...(currentFilters.type && { type: currentFilters.type }),
        ...(currentFilters.search && { search: currentFilters.search }),
      });

      const response = await fetch(`/api/sermons?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SermonsResponse = await response.json();
      setSermons(data.data);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sermons");
      console.error("Error fetching sermons:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sermons when filters change
  useEffect(() => {
    fetchSermons(1, filters);
  }, [filters]);

  // Fetch sermons when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchSermons(currentPage, filters);
    }
  }, [currentPage]);

  const handleFiltersChange = (newFilters: SermonFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full">
      {/* Filters Section */}
      {showFilters && (
        <div className="mb-6">
          <SermonFiltersComponent
            onFiltersChange={handleFiltersChange}
            initialFilters={filters}
            hideTypeFilter={!!type}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading sermons
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => fetchSermons(currentPage, filters)}
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingStates.SermonList />}

      {/* Sermons Grid */}
      {!loading && !error && (
        <>
          {sermons.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sermons.map((sermon) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    showMediaButtons={true}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    showPageNumbers={true}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No sermons found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filters.search || Object.keys(filters).length > 2
                  ? "Try adjusting your search or filter criteria."
                  : "Sermons will appear here once they are uploaded."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
