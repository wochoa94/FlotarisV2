import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Vehicle, VehicleQueryParams, PaginatedVehiclesResponse } from '../types';
import { vehicleService } from '../services/apiService';

type SortColumn = 'name' | 'status' | 'mileage' | 'maintenanceCost' | 'assignedDriver';
type SortDirection = 'asc' | 'desc';

interface UseVehiclesDataReturn {
  // Data
  vehicles: Vehicle[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // State
  searchTerm: string;
  statusFilters: string[];
  unassignedFilter: boolean;
  sortBy: SortColumn | null;
  sortOrder: SortDirection;
  itemsPerPage: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSearchTerm: (term: string) => void;
  toggleStatusFilter: (status: string) => void;
  clearStatusFilters: () => void;
  setUnassignedFilter: (value: boolean) => void;
  setSorting: (column: SortColumn) => void;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  clearAllFilters: () => void;
  refreshData: () => Promise<void>;
}

export function useVehiclesData(): UseVehiclesDataReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL parameters
  const getInitialState = () => {
    const search = searchParams.get('search') || '';
    const status = searchParams.getAll('status');
    const unassigned = searchParams.get('unassigned') === 'true';
    const sortBy = searchParams.get('sortBy') as SortColumn | null;
    const sortOrder = (searchParams.get('sortOrder') as SortDirection) || 'asc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    return {
      search,
      status,
      unassigned,
      sortBy,
      sortOrder,
      page,
      limit,
    };
  };

  const initialState = getInitialState();
  
  // State variables
  const [searchTerm, setSearchTermState] = useState(initialState.search);
  const [statusFilters, setStatusFilters] = useState<string[]>(initialState.status);
  const [unassignedFilter, setUnassignedFilterState] = useState(initialState.unassigned);
  const [sortBy, setSortByState] = useState<SortColumn | null>(initialState.sortBy);
  const [sortOrder, setSortOrderState] = useState<SortDirection>(initialState.sortOrder);
  const [currentPage, setCurrentPageState] = useState(initialState.page);
  const [itemsPerPage, setItemsPerPageState] = useState(initialState.limit);
  
  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (unassignedFilter) params.set('unassigned', 'true');
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    if (itemsPerPage !== 10) params.set('limit', itemsPerPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [debouncedSearchTerm, statusFilters, unassignedFilter, sortBy, sortOrder, currentPage, itemsPerPage, setSearchParams]);

  // Fetch data function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams: VehicleQueryParams = {
        search: debouncedSearchTerm || undefined,
        status: statusFilters.length > 0 ? statusFilters : undefined,
        unassignedOnly: unassignedFilter || undefined,
        sortBy: sortBy || undefined,
        sortOrder,
        page: currentPage,
        limit: itemsPerPage,
      };

      const response: PaginatedVehiclesResponse = await vehicleService.fetchPaginatedVehicles(queryParams);
      
      setVehicles(response.vehicles);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
      setHasNextPage(response.hasNextPage);
      setHasPreviousPage(response.hasPreviousPage);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
      setVehicles([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPreviousPage(false);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilters, unassignedFilter, sortBy, sortOrder, currentPage, itemsPerPage]);

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
    setStatusFilters([]);
    setCurrentPageState(1);
  }, []);

  const setUnassignedFilter = useCallback((value: boolean) => {
    setUnassignedFilterState(value);
    setCurrentPageState(1); // Reset to first page when filtering
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
    setStatusFilters([]);
    setUnassignedFilterState(false);
    setSortByState(null);
    setSortOrderState('asc');
    setCurrentPageState(1);
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    // Data
    vehicles,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    
    // State
    searchTerm,
    statusFilters,
    unassignedFilter,
    sortBy,
    sortOrder,
    itemsPerPage,
    loading,
    error,
    
    // Actions
    setSearchTerm,
    toggleStatusFilter,
    clearStatusFilters,
    setUnassignedFilter,
    setSorting,
    setCurrentPage,
    setItemsPerPage,
    clearAllFilters,
    refreshData,
  };
}