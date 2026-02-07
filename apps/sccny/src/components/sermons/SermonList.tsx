"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Alert, AlertTitle, AlertDescription, AlertActions, Button } from "dark-blue";

export default function SermonList({
  initialSermons = [],
  type,
  showFilters = true,
}: SermonListProps) {
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

  const fetchSermons = useCallback(
    async (page: number = 1, currentFilters: SermonFiltersType = filters) => {
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
        setError(
          err instanceof Error ? err.message : "Failed to fetch sermons"
        );
        console.error("Error fetching sermons:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  // Fetch sermons when filters change
  useEffect(() => {
    fetchSermons(1, filters);
  }, [fetchSermons, filters]);

  // Fetch sermons when page changes
  useEffect(() => {
    if (currentPage > 1) {
      fetchSermons(currentPage, filters);
    }
  }, [currentPage, fetchSermons, filters]);

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
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertTitle>Error loading sermons</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <AlertActions>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchSermons(currentPage, filters)}
              >
                Try again
              </Button>
            </AlertActions>
          </Alert>
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
                className="mx-auto h-12 w-12 text-muted-foreground"
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
              <h3 className="mt-2 text-sm font-medium text-foreground">
                No sermons found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
