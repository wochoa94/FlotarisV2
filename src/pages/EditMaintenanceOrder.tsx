import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFleetData } from '../hooks/useFleetData';
import { maintenanceOrderService } from '../services/apiService';
import { formatUtcDateForInput, getTodayString } from '../utils/dateUtils';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Alert } from '../components/ui/Alert';

interface EditMaintenanceOrderFormData {
  vehicleId: string;
  description: string;
  startDate: string;
  estimatedCompletionDate: string;
  location: string;
  type: string;
  urgent: boolean;
  quotationDetails: string;
  comments: string;
  cost: string;
}

export function EditMaintenanceOrder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, refreshData } = useFleetData();
  
  const [formData, setFormData] = useState<EditMaintenanceOrderFormData>({
    vehicleId: '',
    description: '',
    startDate: '',
    estimatedCompletionDate: '',
    location: '',
    type: '',
    urgent: false,
    quotationDetails: '',
    comments: '',
    cost: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const order = data.maintenanceOrders.find(o => o.id === id);
  const vehicle = order ? data.vehicles.find(v => v.id === order.vehicleId) : null;

  // Initialize form data when order is loaded
  useEffect(() => {
    if (order) {
      setFormData({
        vehicleId: order.vehicleId,
        description: order.description || '',
        // Format UTC date from order to local YYYY-MM-DD for date input
        startDate: order.startDate ? formatUtcDateForInput(order.startDate) : '',
        estimatedCompletionDate: order.estimatedCompletionDate ? formatUtcDateForInput(order.estimatedCompletionDate) : '',
        location: order.location || '',
        type: order.type || '',
        urgent: order.urgent || false,
        quotationDetails: order.quotationDetails || '',
        comments: order.comments || '',
        cost: order.cost?.toString() || '',
      });
    }
  }, [order]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): string | null => {
    if (!formData.vehicleId) return 'Vehicle selection is required';
    if (!formData.description.trim()) return 'Service description is required';
    if (!formData.startDate) return 'Start date is required';
    if (!formData.estimatedCompletionDate) return 'Estimated completion date is required';
    
    // Date validation
    const startDate = new Date(formData.startDate);
    const completionDate = new Date(formData.estimatedCompletionDate);
    
    if (completionDate <= startDate) {
      return 'Estimated completion date must be after start date';
    }
    
    // Cost validation (if provided)
    if (formData.cost.trim() && (isNaN(Number(formData.cost)) || Number(formData.cost) < 0)) {
      return 'Please enter a valid cost amount';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;
    
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');
    
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare update data (excluding status which should not be changed here)
      const updateData = {
        vehicleId: formData.vehicleId,
        description: formData.description.trim(),
        startDate: formData.startDate,
        estimatedCompletionDate: formData.estimatedCompletionDate,
        location: formData.location.trim() || null,
        type: formData.type.trim() || null,
        urgent: formData.urgent,
        quotationDetails: formData.quotationDetails.trim() || null,
        comments: formData.comments.trim() || null,
        cost: formData.cost.trim() ? Number(formData.cost) : null,
      };

      // Update via API service
      await maintenanceOrderService.updateMaintenanceOrder(order.id, updateData);

      // Success feedback
      setSuccessMessage('Maintenance order updated successfully!');
      
      // Refresh fleet data
      await refreshData();
      
      // Redirect to order detail page after a short delay
      setTimeout(() => {
        navigate(`/maintenance-orders/${order.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error updating maintenance order:', error);
      setErrorMessage(
        error instanceof Error 
          ? `Failed to update maintenance order: ${error.message}`
          : 'Failed to update maintenance order. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const dismissMessage = (type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage('');
    } else {
      setErrorMessage('');
    }
  };

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

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Maintenance order not found</div>
        <button 
          onClick={() => navigate('/maintenance-orders')} 
          className="text-blue-600 hover:text-blue-700"
        >
          Back to maintenance orders
        </button>
      </div>
    );
  }

  // Filter available vehicles (current vehicle + vehicles not in maintenance)
  const availableVehicles = data.vehicles.filter(v => 
    v.id === order.vehicleId || v.status !== 'maintenance'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/maintenance-orders/${order.id}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Order Details
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Maintenance Order</h1>
            <p className="text-sm text-gray-600">
              Order #{order.orderNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
            <button
              onClick={() => dismissMessage('success')}
              className="text-green-400 hover:text-green-600 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => dismissMessage('error')}
              className="text-red-400 hover:text-red-600 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Current Order Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Order Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className="ml-2 font-medium capitalize">{order.status.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="text-gray-500">Vehicle:</span>
            <span className="ml-2 font-medium">{vehicle?.name || 'Unknown Vehicle'}</span>
          </div>
          <div>
            <span className="text-gray-500">Created:</span>
            <span className="ml-2 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Vehicle Selection */}
            <div className="sm:col-span-2">
              <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle *
              </label>
              <select
                id="vehicleId"
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a vehicle</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.make} {vehicle.model} {vehicle.year}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Description */}
            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Service Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Describe the maintenance work to be performed..."
              />
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Estimated Completion Date */}
            <div>
              <label htmlFor="estimatedCompletionDate" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Completion Date *
              </label>
              <input
                type="date"
                id="estimatedCompletionDate"
                name="estimatedCompletionDate"
                value={formData.estimatedCompletionDate}
                onChange={handleInputChange}
                required
                min={formData.startDate || getTodayString()}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="e.g., Main Garage, Service Center A"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Maintenance Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select type</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Emergency">Emergency</option>
                <option value="Inspection">Inspection</option>
                <option value="Repair">Repair</option>
                <option value="Service">Service</option>
              </select>
            </div>

            {/* Urgent Checkbox */}
            <div className="sm:col-span-2">
              <div className="flex items-center">
                <input
                  id="urgent"
                  name="urgent"
                  type="checkbox"
                  checked={formData.urgent}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="urgent" className="ml-2 block text-sm text-gray-900">
                  Mark as urgent
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Urgent orders will be prioritized and highlighted in the system
              </p>
            </div>

            {/* Cost */}
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Cost
              </label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
              />
            </div>

            {/* Status (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status (Read-only)
              </label>
              <input
                type="text"
                value={order.status.replace('_', ' ').toUpperCase()}
                disabled
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                Status cannot be changed through editing. Use authorization workflow for status changes.
              </p>
            </div>

            {/* Quotation Details */}
            <div className="sm:col-span-2">
              <label htmlFor="quotationDetails" className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Details
              </label>
              <textarea
                id="quotationDetails"
                name="quotationDetails"
                value={formData.quotationDetails}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Detailed breakdown of costs, parts, labor, etc..."
              />
            </div>

            {/* Comments */}
            <div className="sm:col-span-2">
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                value={formData.comments}
                onChange={handleInputChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Additional notes or special instructions..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to={`/maintenance-orders/${order.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="text-white mr-2" />
                  Updating Order...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Order
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}