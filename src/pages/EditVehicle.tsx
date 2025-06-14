import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFleetData } from '../hooks/useFleetData';
import { supabase } from '../lib/supabase';
import { transformVehicleForDB } from '../utils/dataTransform';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface EditVehicleFormData {
  name: string;
  licensePlate: string;
  lastMaintenance: string;
}

export function EditVehicle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, refreshData } = useFleetData();
  
  const [formData, setFormData] = useState<EditVehicleFormData>({
    name: '',
    licensePlate: '',
    lastMaintenance: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const vehicle = data.vehicles.find(v => v.id === id);

  // Initialize form data when vehicle is loaded
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        licensePlate: vehicle.licensePlate || '',
        lastMaintenance: vehicle.lastMaintenance || '',
      });
    }
  }, [vehicle]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Vehicle name is required';
    if (!formData.licensePlate.trim()) return 'License plate is required';
    if (!formData.lastMaintenance) return 'Last maintenance date is required';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;
    
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
      // Prepare update data
      const updateData = {
        name: formData.name.trim(),
        licensePlate: formData.licensePlate.trim(),
        lastMaintenance: formData.lastMaintenance,
      };

      // Transform to database format
      const dbUpdateData = transformVehicleForDB(updateData);

      // Update in database
      const { error } = await supabase
        .from('vehicles')
        .update(dbUpdateData)
        .eq('id', vehicle.id);

      if (error) {
        throw error;
      }

      // Success feedback
      setSuccessMessage('Vehicle updated successfully!');
      
      // Refresh fleet data
      await refreshData();
      
      // Redirect to vehicle detail page after a short delay
      setTimeout(() => {
        navigate(`/vehicles/${vehicle.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error updating vehicle:', error);
      setErrorMessage(
        error instanceof Error 
          ? `Failed to update vehicle: ${error.message}`
          : 'Failed to update vehicle. Please try again.'
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

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Vehicle not found</div>
        <button 
          onClick={() => navigate('/vehicles')} 
          className="text-blue-600 hover:text-blue-700"
        >
          Back to vehicles
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/vehicles/${vehicle.id}`}
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Vehicle Details
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
            <p className="text-sm text-gray-600">
              Update vehicle information
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

      {/* Current Vehicle Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Current Vehicle Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Make/Model:</span>
            <span className="ml-2 font-medium">{vehicle.make} {vehicle.model} {vehicle.year}</span>
          </div>
          <div>
            <span className="text-gray-500">VIN:</span>
            <span className="ml-2 font-mono">{vehicle.vin || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span className="ml-2 font-medium capitalize">{vehicle.status}</span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Vehicle Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter vehicle name"
              />
            </div>

            {/* License Plate */}
            <div>
              <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-1">
                License Plate *
              </label>
              <input
                type="text"
                id="licensePlate"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter license plate"
              />
            </div>

            {/* Last Maintenance */}
            <div>
              <label htmlFor="lastMaintenance" className="block text-sm font-medium text-gray-700 mb-1">
                Last Maintenance Date *
              </label>
              <input
                type="date"
                id="lastMaintenance"
                name="lastMaintenance"
                value={formData.lastMaintenance}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Read-only Information */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Read-only Information</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Make</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.make || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Model</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.model || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Year</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.year || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">VIN</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{vehicle.vin || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{vehicle.status}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Mileage</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.mileage?.toLocaleString() || 'N/A'} miles</dd>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to={`/vehicles/${vehicle.id}`}
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
                  <LoadingSpinner size="sm\" className="text-white mr-2" />
                  Updating Vehicle...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Vehicle
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}