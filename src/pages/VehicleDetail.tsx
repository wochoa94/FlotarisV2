import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Gauge, DollarSign, User, Settings, Trash2, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useFleetData } from '../hooks/useFleetData';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refreshData } = useFleetData();
  const { user } = useAuth();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleDelete = async () => {
    if (!vehicle) return;

    setIsDeleting(true);
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id);

      if (error) {
        throw error;
      }

      // Success feedback
      setSuccessMessage('Vehicle deleted successfully!');
      
      // Refresh fleet data
      await refreshData();
      
      // Close modal and redirect after a short delay
      setShowDeleteModal(false);
      setTimeout(() => {
        navigate('/vehicles');
      }, 1500);

    } catch (error) {
      console.error('Error deleting vehicle:', error);
      setErrorMessage(
        error instanceof Error 
          ? `Failed to delete vehicle: ${error.message}`
          : 'Failed to delete vehicle. Please try again.'
      );
    } finally {
      setIsDeleting(false);
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

  const vehicle = data.vehicles.find(v => v.id === id);
  const assignedDriver = vehicle?.assignedDriverId 
    ? data.drivers.find(d => d.id === vehicle.assignedDriverId)
    : null;

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
                <AlertTriangle className="h-5 w-5 text-red-400" />
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/vehicles')}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Vehicles
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
            <p className="text-sm text-gray-600">
              {vehicle.make} {vehicle.model} {vehicle.year}
            </p>
          </div>
        </div>
        {user?.isAdmin && (
          <div className="flex items-center space-x-3">
            <Link
              to={`/vehicles/${vehicle.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Vehicle
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Vehicle
            </button>
          </div>
        )}
      </div>

      {/* Status and Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={vehicle.status} />
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gauge className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Mileage</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {vehicle.mileage?.toLocaleString() || 'N/A'} miles
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Maintenance Cost</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${vehicle.maintenanceCost?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Assigned Driver</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {assignedDriver ? (
                      <Link 
                        to={`/drivers/${assignedDriver.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {assignedDriver.name}
                      </Link>
                    ) : (
                      'Unassigned'
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Vehicle Information
            </h3>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Vehicle ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{vehicle.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">VIN</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{vehicle.vin || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">License Plate</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.licensePlate || 'N/A'}</dd>
              </div>
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
                <dt className="text-sm font-medium text-gray-500">Fuel Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{vehicle.fuelType || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(vehicle.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Maintenance Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <Calendar className="h-5 w-5 inline mr-2" />
              Maintenance Information
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Maintenance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicle.lastMaintenance 
                    ? new Date(vehicle.lastMaintenance).toLocaleDateString()
                    : 'Never'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Next Maintenance</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {vehicle.nextMaintenance 
                    ? new Date(vehicle.nextMaintenance).toLocaleDateString()
                    : 'Not scheduled'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Maintenance Cost</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  ${vehicle.maintenanceCost?.toLocaleString() || '0'}
                </dd>
              </div>
              
              {vehicle.nextMaintenance && (
                <div className="mt-4">
                  {(() => {
                    const nextMaintenanceDate = new Date(vehicle.nextMaintenance);
                    const today = new Date();
                    const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntilMaintenance <= 0) {
                      return (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <p className="text-sm text-red-800">
                            ⚠️ Maintenance is overdue!
                          </p>
                        </div>
                      );
                    } else if (daysUntilMaintenance <= 30) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <p className="text-sm text-yellow-800">
                            ⚡ Maintenance due in {daysUntilMaintenance} days
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                          <p className="text-sm text-green-800">
                            ✅ Next maintenance in {daysUntilMaintenance} days
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Assigned Driver Details */}
      {assignedDriver && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <User className="h-5 w-5 inline mr-2" />
              Assigned Driver Details
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{assignedDriver.name}</h4>
                  <p className="text-sm text-gray-500">{assignedDriver.email}</p>
                  <p className="text-sm text-gray-500">ID: {assignedDriver.idNumber}</p>
                </div>
              </div>
              <Link
                to={`/drivers/${assignedDriver.id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Driver Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Vehicle</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Warning:</strong> This action cannot be undone. Are you sure you want to permanently delete this vehicle?
                </p>
                <div className="bg-gray-50 rounded-md p-3">
                  <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                  <p className="text-sm text-gray-500">{vehicle.make} {vehicle.model} {vehicle.year}</p>
                  <p className="text-sm text-gray-500">License: {vehicle.licensePlate}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner size="sm\" className="text-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}