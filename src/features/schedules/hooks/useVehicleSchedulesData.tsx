import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VehicleSchedule, VehicleScheduleQueryParams, PaginatedVehicleSchedulesResponse, VehicleScheduleSummary } from '../../../types';
import { vehicleScheduleService } from '../../../services/apiService';

type SortColumn = 'vehicleName' | 'driverName' | 'startDate' | 'endDate' | 'duration' | 'status';
type SortDirection = 'asc' | 'desc';

interface UseVehicleSchedulesDataReturn {
  // Data
  vehicleSchedules: VehicleSchedule[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // State
  searchTerm: string;
  statusFilters: string[];
  sortBy: SortColumn | null;
  sortOrder: SortDirection;
  itemsPerPage: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSearchTerm: (term: string) => void;
  toggleStatusFilter: (status: string) => void;
  clearStatusFilters: () => void;
  setSorting: (column: SortColumn) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  clearAllFilters: () => void;
  refreshData: () => Promise<void>;

  // Summary data
  vehicleScheduleSummary: VehicleScheduleSummary | null;
}

export function useVehicleSchedulesData(): UseVehicleSchedulesDataReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const getInitialState = () => {
    const search = searchParams.get('search') || '';
    const status = searchParams.getAll('status');
    // If no status filters are specified in URL, use backend's default filters
    const defaultStatusFilters = status.length > 0 ? status : ['active', 'scheduled'];
    const sortBy = searchParams.get('sortBy') as SortColumn | null;
    const sortOrder = (searchParams.get('sortOrder') as SortDirection) || 'desc'; // Default to newest first
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '6', 10);
    
    return {
      search,
      status: defaultStatusFilters,
      sortBy: sortBy || 'startDate', // Default sort by start date
      sortOrder,
      page,
      limit,
    };
  };

  const initialState = getInitialState();
  
  // State variables
  const [searchTerm, setSearchTermState] = useState(initialState.search);
  const [statusFilters, setStatusFilters] = useState<string[]>(initialState.status);
  const [sortBy, setSortByState] = useState<SortColumn | null>(initialState.sortBy);
  const [sortOrder, setSortOrderState] = useState<SortDirection>(initialState.sortOrder);
  const [currentPage, setCurrentPageState] = useState(initialState.page);
  const [itemsPerPage, setItemsPerPageState] = useState(initialState.limit);
  
  // Data state
  const [vehicleSchedules, setVehicleSchedules] = useState<VehicleSchedule[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleScheduleSummary, setVehicleScheduleSummary] = useState<VehicleScheduleSummary | null>(null);

  // Debouncing for search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Update URL parameters when state changes
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
    statusFilters.forEach(status => params.append('status', status));
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (itemsPerPage !== 6) params.set('limit', itemsPerPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [debouncedSearchTerm, statusFilters, sortBy, sortOrder, currentPage, itemsPerPage, setSearchParams]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams: VehicleScheduleQueryParams = {
        search: debouncedSearchTerm || undefined,
        status: statusFilters.length > 0 ? statusFilters : undefined,
        sortBy: sortBy || undefined,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage,
      };

      // Fetch both paginated data and summary concurrently
      const [response, summaryResponse]: [PaginatedVehicleSchedulesResponse, VehicleScheduleSummary] = await Promise.all([
        vehicleScheduleService.fetchPaginatedVehicleSchedules(queryParams),
        vehicleScheduleService.fetchVehicleScheduleSummary()
      ]);
      
      setVehicleSchedules(response.vehicleSchedules);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setHasNextPage(response.hasNextPage);
      setHasPreviousPage(response.hasPreviousPage);
      setVehicleScheduleSummary(summaryResponse);
    } catch (err) {
      console.error('Error fetching vehicle schedules:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicle schedules');
      setVehicleSchedules([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
      setVehicleScheduleSummary(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilters, sortBy, sortOrder, currentPage, itemsPerPage]);

  // Effect to fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Effect to update URL when state changes
  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Action functions
  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
    setCurrentPageState(1); // Reset to first page when searching
  }, []);

  const toggleStatusFilter = useCallback((status: string) => {
    setStatusFilters(prev => {
      const newFilters = prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status];
      setCurrentPageState(1); // Reset to first page when filtering
      return newFilters;
    });
  }, []);

  const clearStatusFilters = useCallback(() => {
    setStatusFilters(['active', 'scheduled']); // Reset to default filters
    setCurrentPageState(1);
  }, []);

  const setSorting = useCallback((column: SortColumn) => {
    if (sortBy === column) {
      // Toggle sort order if same column
      setSortOrderState(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortByState(column);
      setSortOrderState('asc');
    }
    setCurrentPageState(1); // Reset to first page when sorting
  }, [sortBy]);

  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageState(page);
  }, []);

  const setItemsPerPage = useCallback((limit: number) => {
    setItemsPerPageState(limit);
    setCurrentPageState(1); // Reset to first page when changing page size
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTermState('');
    setStatusFilters(['active', 'scheduled']); // Reset to default filters
    setSortByState('startDate');
    setSortOrderState('desc');
    setCurrentPageState(1);
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    // Data
    vehicleSchedules,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    
    // State
    searchTerm,
    statusFilters,
    sortBy,
    sortOrder,
    itemsPerPage,
    loading,
    error,
    
    // Actions
    setSearchTerm,
    toggleStatusFilter,
    clearStatusFilters,
    setSorting,
    setCurrentPage,
    setItemsPerPage,
    clearAllFilters,
    refreshData,

    // Summary data
    vehicleScheduleSummary,
  };
}