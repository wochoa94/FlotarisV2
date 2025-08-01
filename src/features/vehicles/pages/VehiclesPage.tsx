import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useVehiclesData } from '../hooks/useVehiclesData';
import { VehicleTable } from '../components/VehicleTable';
import { VehicleFilterModal } from '../components/VehicleFilterModal';
import { Button } from '../../../components/ui/Button';

export function VehiclesPage() {
  const { user } = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const {
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
  } = useVehiclesData();

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
            <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
            <p className="mt-1 text-sm text-gray-600">Manage your fleet vehicles</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">
              <h3 className="font-medium">Error loading vehicles</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Vehicles</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your fleet vehicles
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
            {(searchTerm || statusFilters.length > 0 || unassignedFilter) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </Button>
          
          {/* Add Vehicle Button */}
          {user?.isAdmin && (
            <Link
              to="/vehicles/new"
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Link>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <VehicleFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        searchTerm={searchTerm}
        statusFilters={statusFilters}
        unassignedFilter={unassignedFilter}
        onSearchTermChange={setSearchTerm}
        onToggleStatusFilter={toggleStatusFilter}
        onUnassignedFilterChange={setUnassignedFilter}
        onClearAllFilters={handleClearAllFilters}
      />

      {/* Vehicle Table */}
      <VehicleTable
        vehicles={vehicles}
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
        statusFilters={statusFilters}
        unassignedFilter={unassignedFilter}
        onSorting={setSorting}
        onCurrentPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        onClearAllFilters={clearAllFilters}
      />
    </div>
  );
}