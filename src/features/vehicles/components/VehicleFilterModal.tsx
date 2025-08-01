import React from 'react';
import { X, Filter, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface VehicleFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  statusFilters: string[];
  unassignedFilter: boolean;
  onSearchTermChange: (term: string) => void;
  onToggleStatusFilter: (status: string) => void;
  onUnassignedFilterChange: (value: boolean) => void;
  onClearAllFilters: () => void;
}

export function VehicleFilterModal({
  isOpen,
  onClose,
  searchTerm,
  statusFilters,
  unassignedFilter,
  onSearchTermChange,
  onToggleStatusFilter,
  onUnassignedFilterChange,
  onClearAllFilters,
}: VehicleFilterModalProps) {
  if (!isOpen) return null;

  const handleClearAllFilters = () => {
    onClearAllFilters();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="px-4 py-5 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Search & Filter Vehicles</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Filter Content */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Vehicles
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by name, VIN, make, or model..."
                />
              </div>
            </div>
            
            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <div className="space-y-2">
                {['active', 'maintenance', 'idle'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={statusFilters.includes(status)}
                      onChange={() => onToggleStatusFilter(status)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Additional Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Filters
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={unassignedFilter}
                    onChange={(e) => onUnassignedFilterChange(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Unassigned only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {(searchTerm || statusFilters.length > 0 || unassignedFilter) && (
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
              onClick={onClose}
              variant="primary"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}