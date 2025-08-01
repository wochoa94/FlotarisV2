import React from 'react';
import { X, Filter, Search } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface DriverFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchTerm: string;
  emailSearchTerm: string;
  onSearchTermChange: (term: string) => void;
  onEmailSearchTermChange: (term: string) => void;
  onClearAllFilters: () => void;
}

export function DriverFilterModal({
  isOpen,
  onClose,
  searchTerm,
  emailSearchTerm,
  onSearchTermChange,
  onEmailSearchTermChange,
  onClearAllFilters,
}: DriverFilterModalProps) {
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
              <h3 className="text-lg font-medium text-gray-900">Search & Filter Drivers</h3>
            </div>
            <button
              onClick={onClose}
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
                  onChange={(e) => onSearchTermChange(e.target.value)}
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
                  onChange={(e) => onEmailSearchTermChange(e.target.value)}
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