"use client";

import { useState, useEffect } from "react";
import { NewsFilters, NewsFiltersProps } from "./types";

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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search news
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
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
            <input
              id="search"
              type="text"
              placeholder="Search news articles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Date From */}
        <div className="w-full lg:w-48">
          <label htmlFor="dateFrom" className="sr-only">
            From date
          </label>
          <input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Date To */}
        <div className="w-full lg:w-48">
          <label htmlFor="dateTo" className="sr-only">
            To date
          </label>
          <input
            id="dateTo"
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Sort By */}
        <div className="w-full lg:w-40">
          <label htmlFor="sortBy" className="sr-only">
            Sort by
          </label>
          <select
            id="sortBy"
            value={filters.sortBy || "date"}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="createdAt">Created</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="w-full lg:w-32">
          <label htmlFor="sortOrder" className="sr-only">
            Sort order
          </label>
          <select
            id="sortOrder"
            value={filters.sortOrder || "desc"}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
