import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Search, Filter, Wrench, Calendar, Clock, DollarSign, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMaintenanceOrdersData } from '../hooks/useMaintenanceOrdersData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MaintenanceOrder } from '../types';
import { formatDate } from '../utils/dateUtils';

// Status badge component for maintenance orders
function MaintenanceStatusBadge({ status }: { status: MaintenanceOrder['status'] }) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    pending_authorization: {
      label: 'Pending Authorization',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}

export function MaintenanceOrders() {
  const { user } = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const {
    // Data
    maintenanceOrders,
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
  } = useMaintenanceOrdersData();

  // Enhanced clear all filters function that also closes the modal
  const handleClearAllFilters = () => {
    clearAllFilters();
    setShowFilterModal(false);
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

  // Calculate summary statistics from current data
  const activeOrders = maintenanceOrders.filter(o => o.status === 'active').length;
  const scheduledOrders = maintenanceOrders.filter(o => o.status === 'scheduled').length;
  const pendingOrders = maintenanceOrders.filter(o => o.status === 'pending_authorization').length;
  const totalCost = maintenanceOrders.reduce((sum, o) => sum + (o.cost || 0), 0);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Orders</h1>
            <p className="mt-1 text-sm text-gray-600">Manage vehicle maintenance orders and schedules</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">
              <h3 className="font-medium">Error loading maintenance orders</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Orders</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage vehicle maintenance orders and schedules
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilterModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(searchTerm || statusFilters.length > 0) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </button>
          
          {/* Add Maintenance Order Button */}
          {user?.isAdmin && (
            <Link
              to="/maintenance-orders/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Maintenance Order
            </Link>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="px-4 py-5 sm:p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Filter className="h-5 w-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Search & Filter Maintenance Orders</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* Search */}
                <div className="lg:col-span-2">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Maintenance Orders
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search by order number, vehicle, location, type, or description..."
                    />
                  </div>
                </div>
                
                {/* Status Filters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Filter
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'active', label: 'Active' },
                      { value: 'scheduled', label: 'Scheduled' },
                      { value: 'pending_authorization', label: 'Pending Authorization' },
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
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  {(searchTerm || statusFilters.length > 0) && (
                    <button
                      onClick={handleClearAllFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 p-3 rounded-md">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                  <dd className="text-lg font-medium text-gray-900">{activeOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

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
                  <dd className="text-lg font-medium text-gray-900">{scheduledOrders}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-yellow-500 p-3 rounded-md">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Auth</dt>
                  <dd className="text-lg font-medium text-gray-900">{pendingOrders}</dd>
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
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Cost</dt>
                  <dd className="text-lg font-medium text-gray-900">${totalCost.toLocaleString()}</dd>
                </dl>
              </div>
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
                Maintenance Orders ({totalCount})
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
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
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

        {/* Maintenance Orders Table */}
        <div className="overflow-x-auto">
          {maintenanceOrders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('orderNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Order Number</span>
                      {renderSortIcon('orderNumber')}
                    </div>
                  </th>
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
                    onClick={() => setSorting('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {renderSortIcon('status')}
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
                    onClick={() => setSorting('estimatedCompletionDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Estimated Completion</span>
                      {renderSortIcon('estimatedCompletionDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('cost')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Cost</span>
                      {renderSortIcon('cost')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {maintenanceOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        Created {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {(order as any).vehicle?.name || 'Unknown Vehicle'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(order as any).vehicle ? 
                            `${(order as any).vehicle.make} ${(order as any).vehicle.model} ${(order as any).vehicle.year}` : 
                            'Vehicle details unavailable'
                          }
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MaintenanceStatusBadge status={order.status} />
                      {order.urgent && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Urgent
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(order.estimatedCompletionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.cost ? `$${order.cost.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/maintenance-orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded inline-flex items-center transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">
                {loading ? 'Loading maintenance orders...' : 
                 (searchTerm || statusFilters.length > 0) ? 
                 'No maintenance orders match your filters' : 'No maintenance orders found'}
              </div>
              {!loading && (searchTerm || statusFilters.length > 0) && (
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
    </div>
  );
}