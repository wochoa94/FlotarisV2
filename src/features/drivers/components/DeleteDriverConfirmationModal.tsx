import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Driver } from '../../../types';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Button } from '../../../components/ui/Button';

interface DeleteDriverConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  isDeleting: boolean;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteDriverConfirmationModal({
  isOpen,
  onClose,
  driver,
  isDeleting,
  onConfirmDelete,
}: DeleteDriverConfirmationModalProps) {
  if (!isOpen || !driver) return null;

  return (
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
              <p className="text-sm font-medium text-gray-900">{driver.name}</p>
              <p className="text-sm text-gray-500">{driver.email}</p>
              <p className="text-sm text-gray-500">ID: {driver.idNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              onClick={onClose}
              disabled={isDeleting}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmDelete}
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
  );
}