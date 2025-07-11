import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Truck, User, FileText, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, RotateCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVehicleSchedulesData } from '../hooks/useVehicleSchedulesData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { VehicleSchedule } from '../types';
import { getDaysBetweenDates, parseDate, parseDateEnd, formatTooltipDate } from '../utils/dateUtils';

// Status badge component for vehicle schedules
function ScheduleStatusBadge({ status }: { status: VehicleSchedule['status'] }) {
  const statusConfig = {
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  // Default configuration for unrecognized status values
  const defaultConfig = {
    label: 'Unknown',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  // Get configuration for the status, with fallback to default
  const config = statusConfig[status as keyof typeof statusConfig] || defaultConfig;
  
  // Log warning for unrecognized status values (helps with debugging)
  if (!statusConfig[status as keyof typeof statusConfig]) {
    console.warn(`Unrecognized schedule status: "${status}". Using default configuration.`);
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}

export function VehicleSchedules() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
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
  } = useVehicleSchedulesData();

  // Modal state for notes
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null);

  // Get vehicle name by ID (from backend response)
  const getVehicleName = (vehicleId: string): string => {
    // Note: The backend should include vehicle details in the response
    // For now, we'll use the vehicleId as fallback
    const schedule = vehicleSchedules.find(s => s.vehicleId === vehicleId);
    return (schedule as any)?.vehicle?.name || `Vehicle ${vehicleId.slice(0, 8)}...`;
  };

  // Get vehicle details by ID (from backend response)
  const getVehicleDetails = (vehicleId: string) => {
    const schedule = vehicleSchedules.find(s => s.vehicleId === vehicleId);
    const vehicle = (schedule as any)?.vehicle;
    return vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : 'Unknown';
  };

  // Get driver name by ID (from backend response)
  const getDriverName = (driverId: string): string => {
    const schedule = vehicleSchedules.find(s => s.driverId === driverId);
    return (schedule as any)?.driver?.name || `Driver ${driverId.slice(0, 8)}...`;
  };

  // Calculate schedule duration using the utility function for accurate inclusive day count
  const getScheduleDuration = (startDate: string, endDate: string): string => {
    const startDateObj = parseDate(startDate);
    const endDateObj = parseDateEnd(endDate);
    const diffDays = getDaysBetweenDates(startDateObj, endDateObj);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Handler for create schedule button
  const handleCreateSchedule = () => {
    navigate('/vehicle-schedules/new');
  };

  const handleEditSchedule = (scheduleId: string) => {
    console.log('Edit schedule clicked for:', scheduleId);
    // TODO: Implement edit schedule functionality
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    console.log('Delete schedule clicked for:', scheduleId);
    // TODO: Implement delete schedule functionality
  };

  const handleViewNotes = (scheduleId: string) => {
    setShowNotesModal(scheduleId);
  };

  const selectedSchedule = showNotesModal ? vehicleSchedules.find(s => s.id === showNotesModal) : null;

  // Calculate summary statistics from current data
  const scheduledCount = vehicleSchedules.filter(s => s.status === 'scheduled').length;
  const activeCount = vehicleSchedules.filter(s => s.status === 'active').length;
  const completedCount = vehicleSchedules.filter(s => s.status === 'completed').length;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Schedules</h1>
            <p className="mt-1 text-sm text-gray-600">Manage vehicle assignments and schedules</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">
              <h3 className="font-medium">Error loading vehicle schedules</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={refreshData}
              className="text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Schedules</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage vehicle assignments and schedules
          </p>
        </div>
        {user?.isAdmin && (
          <button
            onClick={handleCreateSchedule}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Schedule
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                  <dd className="text-lg font-medium text-gray-900">{scheduledCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 p-3 rounded-md">
                  <Truck className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-gray-500 p-3 rounded-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-lg font-medium text-gray-900">{completedCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-purple-500 p-3 rounded-md">
                  <User className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Schedules</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalCount}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search-schedules" className="block text-sm font-medium text-gray-700 mb-1">
                Search Schedules
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search-schedules"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by vehicle, driver, or notes..."
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <div className="space-y-2">
                {[
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' }
                ].map((status) => (
                  <label key={status.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statusFilters.includes(status.value)}
                      onChange={() => toggleStatusFilter(status.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{status.label}</span>
                  </label>
                ))}
              </div>
              
              {/* Clear Filters */}
              {(searchTerm || statusFilters.length !== 2 || !statusFilters.includes('active') || !statusFilters.includes('scheduled')) && (
                <button
                  onClick={clearAllFilters}
                  className="mt-2 inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">
                Vehicle Schedules ({totalCount})
              </h3>
              {loading && <LoadingSpinner size="sm" />}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Items per page */}
              <div className="flex items-center space-x-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md text-sm py-1 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              {totalCount > 0 && (
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedules Table */}
        <div className="overflow-x-auto">
          {vehicleSchedules.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('vehicleName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Vehicle</span>
                      {renderSortIcon('vehicleName')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('driverName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Driver</span>
                      {renderSortIcon('driverName')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('startDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Start Date</span>
                      {renderSortIcon('startDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('endDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>End Date</span>
                      {renderSortIcon('endDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('duration')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Duration</span>
                      {renderSortIcon('duration')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {renderSortIcon('status')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vehicleSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getVehicleName(schedule.vehicleId)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getVehicleDetails(schedule.vehicleId)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="bg-purple-100 h-8 w-8 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {getDriverName(schedule.driverId)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTooltipDate(schedule.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTooltipDate(schedule.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getScheduleDuration(schedule.startDate, schedule.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ScheduleStatusBadge status={schedule.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {schedule.notes && (
                          <button
                            onClick={() => handleViewNotes(schedule.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200"
                            title="View Notes"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        )}
                        {user?.isAdmin && (
                          <>
                            <button
                              onClick={() => handleEditSchedule(schedule.id)}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-colors duration-200"
                              title="Edit Schedule"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200"
                              title="Delete Schedule"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">
                {loading ? 'Loading vehicle schedules...' : 
                 (searchTerm || statusFilters.length !== 2 || !statusFilters.includes('active') || !statusFilters.includes('scheduled')) ? 
                 'No schedules match your filters' : 'No vehicle schedules found'}
              </div>
              {!loading && (searchTerm || statusFilters.length !== 2 || !statusFilters.includes('active') || !statusFilters.includes('scheduled')) && (
                <button
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPreviousPage || loading}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage || loading}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPreviousPage || loading}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  
                  {getPageNumbers().map((pageNumber) => (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      disabled={loading}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNumber
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || loading}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && selectedSchedule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Schedule Notes</h3>
                    <p className="text-sm text-gray-500">
                      {getVehicleName(selectedSchedule.vehicleId)} - {getDriverName(selectedSchedule.driverId)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedSchedule.notes || 'No notes available for this schedule.'}
                </p>
              </div>

              <div className="bg-blue-50 rounded-md p-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <ScheduleStatusBadge status={selectedSchedule.status} />
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNotesModal(null)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}