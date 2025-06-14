import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MaintenanceOrder } from '../../types';

interface AuthorizeMaintenanceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorize: (data: { cost: number; quotationDetails: string; comments: string }) => Promise<void>;
  order: MaintenanceOrder;
  isLoading: boolean;
}

export function AuthorizeMaintenanceOrderModal({
  isOpen,
  onClose,
  onAuthorize,
  order,
  isLoading
}: AuthorizeMaintenanceOrderModalProps) {
  const [formData, setFormData] = useState({
    cost: order.cost?.toString() || '',
    quotationDetails: order.quotationDetails || '',
    comments: order.comments || '',
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        cost: order.cost?.toString() || '',
        quotationDetails: order.quotationDetails || '',
        comments: order.comments || '',
      });
      setValidationError(null);
    }
  }, [isOpen, order]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.cost.trim()) {
      return 'Cost is required for authorization';
    }
    
    const costValue = Number(formData.cost);
    if (isNaN(costValue) || costValue < 0) {
      return 'Please enter a valid cost amount';
    }

    if (!formData.quotationDetails.trim()) {
      return 'Quotation details are required for authorization';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      await onAuthorize({
        cost: Number(formData.cost),
        quotationDetails: formData.quotationDetails.trim(),
        comments: formData.comments.trim(),
      });
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Authorize Maintenance Order</h3>
                <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Order Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Start Date:</span>
                <span className="ml-2 font-medium">{new Date(order.startDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Est. Completion:</span>
                <span className="ml-2 font-medium">{new Date(order.estimatedCompletionDate).toLocaleDateString()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Description:</span>
                <p className="mt-1 text-gray-900">{order.description}</p>
              </div>
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Authorization Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cost */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Authorized Cost *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  id="cost"
                  name="cost"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Quotation Details */}
            <div>
              <label htmlFor="quotationDetails" className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Details *
              </label>
              <textarea
                id="quotationDetails"
                name="quotationDetails"
                value={formData.quotationDetails}
                onChange={handleInputChange}
                required
                rows={4}
                disabled={isLoading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Detailed breakdown of authorized costs, parts, labor, etc..."
              />
            </div>

            {/* Comments */}
            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                Authorization Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={3}
                disabled={isLoading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Additional authorization notes or special instructions..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm\" className="text-white mr-2" />
                    Authorizing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Authorize Order
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}