import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useDriversData } from '../hooks/useDriversData';
import { driverService } from '../../../services/apiService';
import { DriverTable } from '../components/DriverTable';
import { DriverFilterModal } from '../components/DriverFilterModal';
import { DeleteDriverConfirmationModal } from '../components/DeleteDriverConfirmationModal';
import { Button } from '../../../components/ui/Button';
import { Driver } from '../../../types';

export function DriversPage() {
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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; driver: Driver | null }>({
    isOpen: false,
    driver: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle delete driver
  const handleDeleteDriver = async (driver: Driver) => {
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
      <DriverFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        searchTerm={searchTerm}
        emailSearchTerm={emailSearchTerm}
        onSearchTermChange={setSearchTerm}
        onEmailSearchTermChange={setEmailSearchTerm}
        onClearAllFilters={handleClearAllFilters}
      />

      {/* Driver Table */}
      <DriverTable
        drivers={drivers}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={currentPage}
        hasNextPage={hasNextPage}
        hasPreviousPage={hasPreviousPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        itemsPerPage={itemsPerPage}
        loading={loading}
        user={user}
        searchTerm={searchTerm}
        emailSearchTerm={emailSearchTerm}
        onSorting={setSorting}
        onCurrentPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        onClearAllFilters={clearAllFilters}
        onDeleteDriver={handleDeleteDriver}
      />

      {/* Delete Confirmation Modal */}
      <DeleteDriverConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, driver: null })}
        driver={deleteModal.driver}
        isDeleting={isDeleting}
        onConfirmDelete={confirmDeleteDriver}
      />
    </div>
  );
}