// Base news type from API
export interface NewsItem {
  id: string;
  title: string;
  date: string;
  content: string;
  excerpt: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// API response structure
export interface NewsResponse {
  data: NewsItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component props
export interface NewsListProps {
  initialNews?: NewsItem[];
  showFilters?: boolean;
  limit?: number;
}

export interface NewsCardProps {
  item: NewsItem;
  showFullContent?: boolean;
  compact?: boolean;
}

export interface NewsFiltersProps {
  onFiltersChange: (filters: NewsFilters) => void;
  initialFilters?: NewsFilters;
}

// Filter state
export interface NewsFilters {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "title" | "createdAt";
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
