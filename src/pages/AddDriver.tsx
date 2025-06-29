import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFleetData } from '../hooks/useFleetData';
import { driverService } from '../services/apiService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface DriverFormData {
  name: string;
  email: string;
  age: string;
  address: string;
  idNumber: string;
}

export function AddDriver() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshData } = useFleetData();
  
  const [formData, setFormData] = useState<DriverFormData>({
    name: '',
    email: '',
    age: '',
    address: '',
    idNumber: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateIdNumber = (idNumber: string): boolean => {
    // Basic validation: should be alphanumeric and between 6-20 characters
    const idRegex = /^[A-Za-z0-9]{6,20}$/;
    return idRegex.test(idNumber);
  };

  const validateForm = (): string | null => {
    // Required field validation
    if (!formData.name.trim()) return 'Driver name is required';
    if (!formData.email.trim()) return 'Email address is required';
    if (!formData.age.trim()) return 'Age is required';
    if (!formData.address.trim()) return 'Address is required';
    if (!formData.idNumber.trim()) return 'ID number is required';
    
    // Email format validation
    if (!validateEmail(formData.email.trim())) {
      return 'Please enter a valid email address';
    }
    
    // Age validation
    const ageValue = Number(formData.age);
    if (isNaN(ageValue) || ageValue < 18 || ageValue > 100) {
      return 'Age must be between 18 and 100 years';
    }
    
    // ID number validation
    if (!validateIdNumber(formData.idNumber.trim())) {
      return 'ID number must be 6-20 alphanumeric characters';
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
      // Check email uniqueness
      const isEmailUnique = await driverService.checkEmailUniqueness(formData.email);
      if (!isEmailUnique) {
        setErrorMessage('A driver with this email address already exists');
        setIsLoading(false);
        return;
      }

      // Prepare driver data
      const driverData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        age: Number(formData.age),
        address: formData.address.trim(),
        idNumber: formData.idNumber.trim().toUpperCase(),
        userId: null, // No linked user account
      };

      // Add driver via API service
      await driverService.addDriver(driverData);

      // Success feedback
      setSuccessMessage(`Driver "${driverData.name}" added successfully!`);
      
      // Refresh fleet data
      await refreshData();
      
      // Redirect to drivers page after a short delay
      setTimeout(() => {
        navigate('/drivers');
      }, 1500);

    } catch (error) {
      console.error('Error adding driver:', error);
      setErrorMessage(
        error instanceof Error 
          ? `Failed to add driver: ${error.message}`
          : 'Failed to add driver. Please try again.'
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

  // Only allow admin users to access this page
  if (!user?.isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Access denied. Admin privileges required.</div>
        <Link to="/drivers" className="text-blue-600 hover:text-blue-700">
          Back to Drivers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/drivers"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Drivers
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Driver</h1>
            <p className="text-sm text-gray-600">
              Create a new driver profile for your fleet
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
            {/* Driver Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter driver's full name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="driver@example.com"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be unique across the system
              </p>
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age *
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                required
                min="18"
                max="100"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="25"
              />
              <p className="mt-1 text-xs text-gray-500">
                Must be between 18 and 100 years
              </p>
            </div>

            {/* ID Number */}
            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
                ID Number *
              </label>
              <input
                type="text"
                id="idNumber"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleInputChange}
                required
                maxLength={20}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                placeholder="ABC123456"
              />
              <p className="mt-1 text-xs text-gray-500">
                6-20 alphanumeric characters (license number, employee ID, etc.)
              </p>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter complete address including city, state, and postal code"
              />
            </div>
          </div>

          {/* Information Notice */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Driver Profile Information</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>This creates a driver profile only (no user account)</li>
                    <li>The driver will not have system login access</li>
                    <li>Email must be unique across all drivers</li>
                    <li>All fields marked with * are required</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <Link
              to="/drivers"
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
                  Adding Driver...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Driver
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}