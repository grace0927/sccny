"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  SermonFiltersProps,
  SermonFilters as SermonFiltersType,
} from "./types";
import { SermonType } from "@/generated/prisma";

export default function SermonFilters({
  onFiltersChange,
  initialFilters = {},
  hideTypeFilter = false,
}: SermonFiltersProps) {
  const t = useTranslations("SermonFilters");
  const [filters, setFilters] = useState<SermonFiltersType>(initialFilters);

  // Debounced search input
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const handleSearchChange = (value: string) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Update local state immediately for UI responsiveness
    setFilters((prev) => ({ ...prev, search: value }));

    // Debounce the filter change
    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleFilterChange = (
    key: keyof SermonFiltersType,
    value: string | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: SermonFiltersType = {
      sortBy: "date",
      sortOrder: "desc",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key as keyof SermonFiltersType];
    // When type filter is hidden, don't consider type as an active filter
    if (hideTypeFilter && key === "type") {
      return false;
    }
    return (
      value &&
      value !== "date" &&
      value !== "desc" &&
      key !== "sortBy" &&
      key !== "sortOrder"
    );
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {t("title", { defaultValue: "Filter Sermons" })}
        </h3>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            {t("clearAll", { defaultValue: "Clear All" })}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("search", { defaultValue: "Search" })}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
              type="text"
              id="search"
              value={filters.search || ""}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t("searchPlaceholder", {
                defaultValue: "Search by title, speaker, or scripture...",
              })}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Speaker Filter */}
        <div>
          <label
            htmlFor="speaker"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("speaker", { defaultValue: "Speaker" })}
          </label>
          <input
            type="text"
            id="speaker"
            value={filters.speaker || ""}
            onChange={(e) => handleFilterChange("speaker", e.target.value)}
            placeholder={t("speakerPlaceholder", {
              defaultValue: "Filter by speaker",
            })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Series Filter */}
        <div>
          <label
            htmlFor="series"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("series", { defaultValue: "Series" })}
          </label>
          <input
            type="text"
            id="series"
            value={filters.series || ""}
            onChange={(e) => handleFilterChange("series", e.target.value)}
            placeholder={t("seriesPlaceholder", {
              defaultValue: "Filter by series",
            })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Sermon Type Filter */}
        {!hideTypeFilter && (
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("type", { defaultValue: "Type" })}
            </label>
            <select
              id="type"
              value={filters.type || ""}
              onChange={(e) =>
                handleFilterChange("type", e.target.value || undefined)
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">
                {t("allTypes", { defaultValue: "All Types" })}
              </option>
              <option value={SermonType.SERMON}>
                {t("sermon", { defaultValue: "Sermon" })}
              </option>
              <option value={SermonType.SUNDAY_SCHOOL}>
                {t("sundaySchool", { defaultValue: "Sunday School" })}
              </option>
              <option value={SermonType.RETREAT_MESSAGE}>
                {t("retreatMessage", { defaultValue: "Retreat Message" })}
              </option>
              <option value={SermonType.BAPTISM_CLASS}>
                {t("baptismClass", { defaultValue: "Baptism Class" })}
              </option>
            </select>
          </div>
        )}

        {/* Sort Options */}
        <div>
          <label
            htmlFor="sortBy"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("sortBy", { defaultValue: "Sort By" })}
          </label>
          <div className="flex gap-2">
            <select
              id="sortBy"
              value={filters.sortBy || "date"}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="date">
                {t("date", { defaultValue: "Date" })}
              </option>
              <option value="title">
                {t("title", { defaultValue: "Title" })}
              </option>
              <option value="speaker">
                {t("speaker", { defaultValue: "Speaker" })}
              </option>
            </select>

            <select
              id="sortOrder"
              value={filters.sortOrder || "desc"}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="desc">
                {t("descending", { defaultValue: "↓" })}
              </option>
              <option value="asc">
                {t("ascending", { defaultValue: "↑" })}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">
              {t("activeFilters", { defaultValue: "Active filters" })}:
            </span>
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t("search", { defaultValue: "Search" })}: "{filters.search}"
                <button
                  onClick={() => handleFilterChange("search", "")}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {filters.speaker && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t("speaker", { defaultValue: "Speaker" })}: {filters.speaker}
                <button
                  onClick={() => handleFilterChange("speaker", "")}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {filters.series && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {t("series", { defaultValue: "Series" })}: {filters.series}
                <button
                  onClick={() => handleFilterChange("series", "")}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {t("type", { defaultValue: "Type" })}: {filters.type}
                <button
                  onClick={() => handleFilterChange("type", undefined)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
