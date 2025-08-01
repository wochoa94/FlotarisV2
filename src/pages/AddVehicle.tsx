import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFleetData } from '../hooks/useFleetData';
import { vehicleService } from '../services/apiService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';

interface VehicleFormData {
  name: string;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  fuelType: string;
  mileage: string;
  lastMaintenance: string;
  maintenanceCost: string;
}

export function AddVehicle() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshData } = useFleetData();
  
  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    vin: '',
    licensePlate: '',
    make: '',
    model: '',
    year: '',
    fuelType: '',
    mileage: '',
    lastMaintenance: '',
    maintenanceCost: '',
  });

  const [isLoading, setIsLoading] = useState(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!formData.maintenanceCost.trim()) return 'Initial maintenance cost is required';
    
    // VIN validation (basic format check)
    if (formData.vin && formData.vin.length < 17) return 'VIN must be at least 17 characters';
    
    // Year validation
    if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear() + 1)) {
      return 'Please enter a valid year';
    }
    
    // Mileage validation
    if (formData.mileage && (isNaN(Number(formData.mileage)) || Number(formData.mileage) < 0)) {
      return 'Please enter a valid mileage';
    }
    
    // Maintenance cost validation
    if (isNaN(Number(formData.maintenanceCost)) || Number(formData.maintenanceCost) < 0) {
      return 'Please enter a valid maintenance cost';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Prepare vehicle data
      const vehicleData = {
        name: formData.name.trim(),
        vin: formData.vin.trim().toUpperCase() || null,
        licensePlate: formData.licensePlate.trim(),
        make: formData.make.trim() || null,
        model: formData.model.trim() || null,
        year: formData.year ? Number(formData.year) : null,
        fuelType: formData.fuelType.trim() || null,
        mileage: formData.mileage ? Number(formData.mileage) : 0,
        lastMaintenance: formData.lastMaintenance,
        nextMaintenance: null,
        maintenanceCost: Number(formData.maintenanceCost),
        status: 'idle' as const, // Auto-assign idle status
        assignedDriverId: null,
        userId: user?.id,
      };

      // Add vehicle via API service
      await vehicleService.addVehicle(vehicleData);

      // Success feedback
      setSuccessMessage('Vehicle added successfully!');
      
      // Refresh fleet data
      await refreshData();
      
      // Redirect to vehicles page after a short delay
      setTimeout(() => {
        navigate('/vehicles');
      }, 1500);

    } catch (error) {
      console.error('Error adding vehicle:', error);
      setErrorMessage(
        error instanceof Error 
          ? `Failed to add vehicle: ${error.message}`
          : 'Failed to add vehicle. Please try again.'
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/vehicles"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Vehicles
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Vehicle</h1>
            <p className="text-sm text-gray-600">
              Add a new vehicle to your fleet
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

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Vehicle Name */}
            <div className="sm:col-span-2">
              <Label htmlFor="name">
                Vehicle Name *
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter vehicle name"
              />
            </div>

            {/* License Plate */}
            <div>
              <Label htmlFor="licensePlate">
                License Plate *
              </Label>
              <Input
                type="text"
                id="licensePlate"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                required
                placeholder="Enter license plate"
              />
            </div>

            {/* VIN */}
            <div>
              <Label htmlFor="vin">
                VIN (Vehicle Identification Number)
              </Label>
              <Input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                maxLength={17}
                className="font-mono"
                placeholder="17-character VIN (optional)"
              />
            </div>

            {/* Make */}
            <div>
              <Label htmlFor="make">
                Make
              </Label>
              <Input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                placeholder="e.g., Toyota, Ford, Honda"
              />
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model">
                Model
              </Label>
              <Input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., Camry, F-150, Civic"
              />
            </div>

            {/* Year */}
            <div>
              <Label htmlFor="year">
                Year
              </Label>
              <Input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="e.g., 2023"
              />
            </div>

            {/* Fuel Type */}
            <div>
              <Label htmlFor="fuelType">
                Fuel Type
              </Label>
              <Input
                type="text"
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                placeholder="e.g., Gasoline, Diesel, Electric, Hybrid"
              />
            </div>

            {/* Mileage */}
            <div>
              <Label htmlFor="mileage">
                Current Mileage
              </Label>
              <Input
                type="number"
                id="mileage"
                name="mileage"
                value={formData.mileage}
                onChange={handleInputChange}
                min="0"
                placeholder="Enter current mileage"
              />
            </div>

            {/* Last Maintenance */}
            <div>
              <Label htmlFor="lastMaintenance">
                Last Maintenance Date *
              </Label>
              <Input
                type="date"
                id="lastMaintenance"
                name="lastMaintenance"
                value={formData.lastMaintenance}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Initial Maintenance Cost */}
            <div>
              <Label htmlFor="maintenanceCost">
                Initial Maintenance Cost *
              </Label>
              <Input
                type="number"
                id="maintenanceCost"
                name="maintenanceCost"
                value={formData.maintenanceCost}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to="/vehicles"
              className="btn-secondary"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="text-white mr-2" />
                  Adding Vehicle...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vehicle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}