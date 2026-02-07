"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  SermonFiltersProps,
  SermonFilters as SermonFiltersType,
} from "./types";
import { SermonType } from "@/generated/prisma/browser";
import { Card, CardContent, Input, Select, Label, Button, Badge } from "dark-blue";

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
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h3 className="text-lg font-medium text-foreground">
            {t("title", { defaultValue: "Filter Sermons" })}
          </h3>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
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
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <Label htmlFor="search">
              {t("search", { defaultValue: "Search" })}
            </Label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-muted-foreground"
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
              <Input
                type="text"
                id="search"
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={t("searchPlaceholder", {
                  defaultValue: "Search by title, speaker, or scripture...",
                })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Speaker Filter */}
          <div>
            <Label htmlFor="speaker">
              {t("speaker", { defaultValue: "Speaker" })}
            </Label>
            <Input
              type="text"
              id="speaker"
              value={filters.speaker || ""}
              onChange={(e) => handleFilterChange("speaker", e.target.value)}
              placeholder={t("speakerPlaceholder", {
                defaultValue: "Filter by speaker",
              })}
              className="mt-1"
            />
          </div>

          {/* Series Filter */}
          <div>
            <Label htmlFor="series">
              {t("series", { defaultValue: "Series" })}
            </Label>
            <Input
              type="text"
              id="series"
              value={filters.series || ""}
              onChange={(e) => handleFilterChange("series", e.target.value)}
              placeholder={t("seriesPlaceholder", {
                defaultValue: "Filter by series",
              })}
              className="mt-1"
            />
          </div>

          {/* Sermon Type Filter */}
          {!hideTypeFilter && (
            <div>
              <Label htmlFor="type">
                {t("type", { defaultValue: "Type" })}
              </Label>
              <Select
                id="type"
                value={filters.type || ""}
                onChange={(e) =>
                  handleFilterChange("type", e.target.value || undefined)
                }
                className="mt-1"
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
              </Select>
            </div>
          )}

          {/* Sort Options */}
          <div>
            <Label htmlFor="sortBy">
              {t("sortBy", { defaultValue: "Sort By" })}
            </Label>
            <div className="flex gap-2 mt-1">
              <Select
                id="sortBy"
                value={filters.sortBy || "date"}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
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
              </Select>

              <Select
                id="sortOrder"
                value={filters.sortOrder || "desc"}
                onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              >
                <option value="desc">
                  {t("descending", { defaultValue: "↓" })}
                </option>
                <option value="asc">
                  {t("ascending", { defaultValue: "↑" })}
                </option>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                {t("activeFilters", { defaultValue: "Active filters" })}:
              </span>
              {filters.search && (
                <Badge variant="subtle">
                  {t("search", { defaultValue: "Search" })}: &quot;
                  {filters.search}&quot;
                  <button
                    onClick={() => handleFilterChange("search", "")}
                    className="ml-1"
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
                </Badge>
              )}
              {filters.speaker && (
                <Badge variant="subtle">
                  {t("speaker", { defaultValue: "Speaker" })}: {filters.speaker}
                  <button
                    onClick={() => handleFilterChange("speaker", "")}
                    className="ml-1"
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
                </Badge>
              )}
              {filters.series && (
                <Badge variant="subtle">
                  {t("series", { defaultValue: "Series" })}: {filters.series}
                  <button
                    onClick={() => handleFilterChange("series", "")}
                    className="ml-1"
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
                </Badge>
              )}
              {filters.type && (
                <Badge variant="subtle">
                  {t("type", { defaultValue: "Type" })}: {filters.type}
                  <button
                    onClick={() => handleFilterChange("type", undefined)}
                    className="ml-1"
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
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
