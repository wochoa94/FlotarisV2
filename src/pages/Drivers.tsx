import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit, Plus, Search, Filter, User, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDriversData } from '../hooks/useDriversData';
import { driverService } from '../services/apiService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';

export function Drivers() {
  const { user } = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const {
    // Data
    drivers,
    totalCount,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    
    // State
    searchTerm,
    emailSearchTerm,
    sortBy,
    sortOrder,
    itemsPerPage,
    loading,
    error,
    
    // Actions
    setSearchTerm,
    setEmailSearchTerm,
    setSorting,
    setCurrentPage,
    setItemsPerPage,
    clearAllFilters,
    refreshData,
  } = useDriversData();

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; driver: any | null }>({
    isOpen: false,
    driver: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete driver
  const handleDeleteDriver = async (driver: any) => {
    setDeleteModal({ isOpen: true, driver });
  };

  const confirmDeleteDriver = async () => {
    if (!deleteModal.driver) return;

    setIsDeleting(true);
    try {
      await driverService.deleteDriver(deleteModal.driver.id);
      await refreshData();
      setDeleteModal({ isOpen: false, driver: null });
    } catch (error) {
      console.error('Error deleting driver:', error);
      // You could add error handling here
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your fleet drivers</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">
              <h3 className="font-medium">Error loading drivers</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your fleet drivers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Filter Button */}
          <Button
            onClick={() => setShowFilterModal(true)}
            variant="secondary"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(searchTerm || emailSearchTerm) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </Button>
          
          {/* Add Driver Button */}
          {user?.isAdmin && (
            <Link
              to="/drivers/new"
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
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
                  <h3 className="text-lg font-medium text-gray-900">Search & Filter Drivers</h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Name Search */}
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search by Name
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
                      placeholder="Search by driver name..."
                    />
                  </div>
                </div>
                
                {/* Email Search */}
                <div>
                  <label htmlFor="emailSearch" className="block text-sm font-medium text-gray-700 mb-1">
                    Search by Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="emailSearch"
                      value={emailSearchTerm}
                      onChange={(e) => setEmailSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search by email address..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                <div>
                  {(searchTerm || emailSearchTerm) && (
                    <Button
                      onClick={handleClearAllFilters}
                      variant="secondary"
                      className="px-3 py-2"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear All Filters
                    </Button>
                  )}
                </div>
                <Button
                  onClick={() => setShowFilterModal(false)}
                  variant="primary"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">
                Drivers ({totalCount})
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

        {/* Drivers Table */}
        <div className="overflow-x-auto">
          {drivers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Driver Name</span>
                      {renderSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('email')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Email Address</span>
                      {renderSortIcon('email')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('idNumber')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>ID Number</span>
                      {renderSortIcon('idNumber')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Vehicle
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                    onClick={() => setSorting('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {renderSortIcon('createdAt')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="bg-purple-100 h-10 w-10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link
                            to={`/drivers/${driver.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            {driver.name}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {driver.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {driver.idNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.assignedVehicle ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {driver.assignedVehicle.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {driver.assignedVehicle.licensePlate || 'No plate'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(driver.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/drivers/${driver.id}`}
                          className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors duration-200"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {user?.isAdmin && (
                          <>
                            <Link
                              to={`/drivers/${driver.id}/edit`}
                              className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded transition-colors duration-200"
                              title="Edit Driver"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDeleteDriver(driver)}
                              className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors duration-200"
                              title="Delete Driver"
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
          ) : (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 mb-4">
                {loading ? 'Loading drivers...' : 
                 (searchTerm || emailSearchTerm) ? 
                 'No drivers match your search' : 'No drivers found'}
              </div>
              {!loading && (searchTerm || emailSearchTerm) && (
                <button
                  onClick={handleClearAllFilters}
                  className="text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Clear search filters
                </button>
              )}
              {!loading && !searchTerm && !emailSearchTerm && user?.isAdmin && (
                <Link
                  to="/drivers/new"
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Driver
                </Link>
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

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.driver && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Driver</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Warning:</strong> This action cannot be undone. Are you sure you want to permanently delete this driver?
                </p>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm font-medium text-gray-900">{deleteModal.driver.name}</p>
                  <p className="text-sm text-gray-500">{deleteModal.driver.email}</p>
                  <p className="text-sm text-gray-500">ID: {deleteModal.driver.idNumber}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Button
                  onClick={() => setDeleteModal({ isOpen: false, driver: null })}
                  disabled={isDeleting}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteDriver}
                  disabled={isDeleting}
                  variant="danger"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner size="sm" className="text-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Confirm Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}