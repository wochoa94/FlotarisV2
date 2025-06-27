import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Edit, Plus, Search, Filter, Calendar, Truck, User, FileText, Trash2, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useFleetData } from '../hooks/useFleetData';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { VehicleSchedule } from '../types';
import { getDaysBetweenDates, parseDate, parseDateEnd, formatTooltipDate } from '../utils/dateUtils';

type SortColumn = 'vehicleName' | 'driverName' | 'startDate' | 'endDate' | 'duration' | 'status';
type SortDirection = 'asc' | 'desc';

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
  const { data, loading, error } = useFleetData();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for search, filtering, sorting, and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active_scheduled'); // Hide completed by default
  const [sortColumn, setSortColumn] = useState<SortColumn>('startDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Newest first
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null);
  
  const itemsPerPage = 6;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="text-blue-600 hover:text-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const { vehicleSchedules, vehicles, drivers } = data;

  // Get vehicle name by ID
  const getVehicleName = (vehicleId: string): string => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? vehicle.name : 'Unknown Vehicle';
  };

  // Get vehicle details by ID
  const getVehicleDetails = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : 'Unknown';
  };

  // Get driver name by ID
  const getDriverName = (driverId: string): string => {
    const driver = drivers.find(d => d.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  // Calculate schedule duration using the utility function for accurate inclusive day count
  const getScheduleDuration = (startDate: string, endDate: string): string => {
    const startDateObj = parseDate(startDate);
    const endDateObj = parseDateEnd(endDate);
    const diffDays = getDaysBetweenDates(startDateObj, endDateObj);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Filter schedules based on search term and status
  const filteredSchedules = vehicleSchedules.filter(schedule => {
    const vehicleName = getVehicleName(schedule.vehicleId);
    const driverName = getDriverName(schedule.driverId);
    
    const matchesSearch = searchTerm === '' || 
      vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active_scheduled' && (schedule.status === 'active' || schedule.status === 'scheduled')) ||
      schedule.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort schedules
  const sortedSchedules = [...filteredSchedules].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortColumn) {
      case 'vehicleName':
        aValue = getVehicleName(a.vehicleId).toLowerCase();
        bValue = getVehicleName(b.vehicleId).toLowerCase();
        break;
      case 'driverName':
        aValue = getDriverName(a.driverId).toLowerCase();
        bValue = getDriverName(b.driverId).toLowerCase();
        break;
      case 'startDate':
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
        break;
      case 'endDate':
        aValue = new Date(a.endDate).getTime();
        bValue = new Date(b.endDate).getTime();
        break;
      case 'duration':
        aValue = getDaysBetweenDates(parseDate(a.startDate), parseDateEnd(a.endDate));
        bValue = getDaysBetweenDates(parseDate(b.startDate), parseDateEnd(b.endDate));
        break;
      case 'status':
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      default:
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedSchedules.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchedules = sortedSchedules.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination handlers
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Render sort icon
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ChevronUp className="h-4 w-4 text-gray-300" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  // Calculate summary statistics based on status field
  const scheduledCount = vehicleSchedules.filter(s => s.status === 'scheduled').length;
  const activeCount = vehicleSchedules.filter(s => s.status === 'active').length;
  const completedCount = vehicleSchedules.filter(s => s.status === 'completed').length;

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
                  <dd className="text-lg font-medium text-gray-900">{vehicleSchedules.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by vehicle, driver, or notes..."
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page when filtering
                  }}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="active_scheduled">Active & Scheduled</option>
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Vehicle Schedules ({sortedSchedules.length})
            </h3>
            {sortedSchedules.length > 0 && (
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedSchedules.length)} of {sortedSchedules.length}
              </div>
            )}
          </div>
          
          {currentSchedules.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleSort('vehicleName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Vehicle</span>
                          {renderSortIcon('vehicleName')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleSort('driverName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Driver</span>
                          {renderSortIcon('driverName')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleSort('startDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Start Date</span>
                          {renderSortIcon('startDate')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleSort('endDate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>End Date</span>
                          {renderSortIcon('endDate')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleSort('duration')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Duration</span>
                          {renderSortIcon('duration')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                        onClick={() => handleSort('status')}
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
                    {currentSchedules.map((schedule) => (
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
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200"
                                  title="Delete Schedule"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(indexOfLastItem, sortedSchedules.length)}</span> of{' '}
                        <span className="font-medium">{sortedSchedules.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        ))}
                        
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'active_scheduled' ? 'No schedules match your filters' : 'No vehicle schedules found'}
              </div>
              {(searchTerm || statusFilter !== 'active_scheduled') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('active_scheduled');
                  }}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
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