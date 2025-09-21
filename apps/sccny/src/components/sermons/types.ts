import { SermonType } from "@/generated/prisma";

// Base sermon type from API
export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  type: SermonType;
  series?: string | null;
  scripture?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

// API response structure
export interface SermonsResponse {
  data: Sermon[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component props
export interface SermonListProps {
  initialSermons?: Sermon[];
  type?: SermonType;
  showFilters?: boolean;
}

export interface SermonCardProps {
  sermon: Sermon;
  showMediaButtons?: boolean;
  compact?: boolean;
}

export interface SermonFiltersProps {
  onFiltersChange: (filters: SermonFilters) => void;
  initialFilters?: SermonFilters;
  hideTypeFilter?: boolean;
}

export interface MediaPlayerProps {
  videoUrl?: string;
  audioUrl?: string;
  title: string;
}

// Filter state
export interface SermonFilters {
  search?: string;
  speaker?: string;
  series?: string;
  type?: SermonType;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "title" | "speaker";
  sortOrder?: "asc" | "desc";
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Pagination props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
}
