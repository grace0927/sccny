"use client";

import { useState, useEffect } from "react";
import { NewsFilters, NewsFiltersProps } from "./types";
import { Card, CardContent, Input, Select, Button } from "dark-blue";

export default function NewsFiltersComponent({
  onFiltersChange,
  initialFilters = {},
}: NewsFiltersProps) {
  const [filters, setFilters] = useState<NewsFilters>({
    sortBy: "date",
    sortOrder: "desc",
    status: "PUBLISHED",
    ...initialFilters,
  });

  const [searchInput, setSearchInput] = useState(filters.search || "");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchInput !== filters.search) {
        const newFilters = { ...filters, search: searchInput || undefined };
        setFilters(newFilters);
        onFiltersChange(newFilters);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, filters, onFiltersChange]);

  const handleFilterChange = (key: keyof NewsFilters, value: string) => {
    const newFilters = {
      ...filters,
      [key]: value || undefined,
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: NewsFilters = {
      sortBy: "date",
      sortOrder: "desc",
      status: "PUBLISHED",
    };
    setFilters(clearedFilters);
    setSearchInput("");
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = searchInput || filters.dateFrom || filters.dateTo;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search news
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                id="search"
                type="text"
                placeholder="Search news articles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date From */}
          <div className="w-full lg:w-48">
            <label htmlFor="dateFrom" className="sr-only">
              From date
            </label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>

          {/* Date To */}
          <div className="w-full lg:w-48">
            <label htmlFor="dateTo" className="sr-only">
              To date
            </label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>

          {/* Sort By */}
          <div className="w-full lg:w-40">
            <label htmlFor="sortBy" className="sr-only">
              Sort by
            </label>
            <Select
              id="sortBy"
              value={filters.sortBy || "date"}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="createdAt">Created</option>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="w-full lg:w-32">
            <label htmlFor="sortOrder" className="sr-only">
              Sort order
            </label>
            <Select
              id="sortOrder"
              value={filters.sortOrder || "desc"}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </Select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
