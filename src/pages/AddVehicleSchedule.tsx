import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, AlertCircle, CheckCircle, ChevronRight, ChevronLeft, Calendar, Truck, User, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFleetData } from '../hooks/useFleetData';
import { vehicleScheduleService } from '../services/apiService';
import { getTodayString, getDaysBetweenDates, parseDate, parseDateEnd } from '../utils/dateUtils';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import { Input } from '../components/ui/Input';

interface VehicleScheduleFormData {
  vehicleId: string;
  startDate: string;
  endDate: string;
  driverId: string;
  notes: string;
}

export function AddVehicleSchedule() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, refreshData } = useFleetData();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<VehicleScheduleFormData>({
    vehicleId: '',
    startDate: '',
    endDate: '',
    driverId: '',
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stepErrors, setStepErrors] = useState<{ [key: number]: string }>({});

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear step error when user makes changes
    if (stepErrors[currentStep]) {
      setStepErrors(prev => ({
        ...prev,
        [currentStep]: '',
      }));
    }
  };

  // Handle Enter key press in notes textarea to prevent form submission
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Allow Shift+Enter for new lines, but prevent plain Enter from submitting the form
      e.preventDefault();
      // Insert a new line manually
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const newValue = value.substring(0, start) + '\n' + value.substring(end);
      
      setFormData(prev => ({
        ...prev,
        notes: newValue,
      }));
      
      // Set cursor position after the inserted newline
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  // Basic validation for each step (no overlap checks - handled by backend)
  const validateCurrentStep = (): boolean => {
    let error: string | null = null;
    
    switch (currentStep) {
      case 1:
        // Step 1: Vehicle Selection
        if (!formData.vehicleId) {
          error = 'Vehicle selection is required';
        } else {
          const vehicle = data.vehicles.find(v => v.id === formData.vehicleId);
          if (!vehicle) {
            error = 'Selected vehicle not found';
          }
        }
        break;
        
      case 2:
        // Step 2: Date Range
        if (!formData.startDate) {
          error = 'Start date is required';
        } else if (!formData.endDate) {
          error = 'End date is required';
        } else {
          const startDate = new Date(formData.startDate);
          const endDate = new Date(formData.endDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (startDate < today) {
            error = 'Start date cannot be in the past';
          } else if (endDate <= startDate) {
            error = 'End date must be after start date';
          }
        }
        break;
        
      case 3:
        // Step 3: Driver Selection
        if (!formData.driverId) {
          error = 'Driver selection is required';
        } else {
          const driver = data.drivers.find(d => d.id === formData.driverId);
          if (!driver) {
            error = 'Selected driver not found';
          }
        }
        break;
    }
    
    if (error) {
      setStepErrors(prev => ({
        ...prev,
        [currentStep]: error,
      }));
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');
    
    // Basic validation only - overlap checks handled by backend
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare vehicle schedule data
      const scheduleData = {
        vehicleId: formData.vehicleId,
        driverId: formData.driverId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes.trim() || null,
        status: 'scheduled' as const,
        userId: user?.id || '',
      };

      // Add vehicle schedule via API service - backend will handle overlap validation
      await vehicleScheduleService.addVehicleSchedule(scheduleData);

      // Success feedback
      setSuccessMessage('Vehicle schedule created successfully!');
      
      // Refresh fleet data
      await refreshData();
      
      // Redirect to vehicle schedules page after a short delay
      setTimeout(() => {
        navigate('/vehicle-schedules');
      }, 1500);

    } catch (error) {
      console.error('Error creating vehicle schedule:', error);
      
      // Handle specific backend validation errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to create vehicle schedule. Please try again.';
      
      // Check for overlap-related errors from backend
      if (errorMessage.includes('unavailable') || errorMessage.includes('conflict') || errorMessage.includes('overlap')) {
        setErrorMessage(`Schedule conflict: ${errorMessage}`);
      } else {
        setErrorMessage(`Failed to create vehicle schedule: ${errorMessage}`);
      }
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

  // Show all vehicles in the fleet, including those in maintenance
  const availableVehicles = data.vehicles;
  
  // Get selected vehicle details
  const selectedVehicle = formData.vehicleId ? data.vehicles.find(v => v.id === formData.vehicleId) : null;
  
  // Get selected driver details
  const selectedDriver = formData.driverId ? data.drivers.find(d => d.id === formData.driverId) : null;

  // Step configuration - simplified unlocked logic
  const steps = [
    { 
      number: 1, 
      title: 'Vehicle Selection', 
      icon: Truck, 
      unlocked: true 
    },
    { 
      number: 2, 
      title: 'Date Range', 
      icon: Calendar, 
      unlocked: currentStep >= 2 || !!formData.vehicleId 
    },
    { 
      number: 3, 
      title: 'Driver & Notes', 
      icon: User, 
      unlocked: currentStep >= 3 || (!!formData.vehicleId && !!formData.startDate && !!formData.endDate) 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/vehicle-schedules"
            className="inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Vehicle Schedules
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Vehicle Schedule</h1>
            <p className="text-sm text-gray-600">
              Schedule a vehicle assignment for your fleet
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

      {/* Step Progress Indicator */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;
                const isUnlocked = step.unlocked;
                
                return (
                  <li key={step.number} className={`${stepIdx !== steps.length - 1 ? 'flex-1' : ''} relative`}>
                    <div className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors duration-200 ${
                        isCompleted 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : isActive 
                            ? 'border-blue-600 text-blue-600 bg-white' 
                            : isUnlocked
                              ? 'border-gray-300 text-gray-500 bg-white'
                              : 'border-gray-200 text-gray-300 bg-gray-50'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : isUnlocked ? 'text-gray-500' : 'text-gray-300'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="absolute top-5 left-10 w-full h-0.5 bg-gray-200">
                        <div className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-blue-600 w-full' : 'bg-gray-200 w-0'
                        }`} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Step Error Message */}
      {stepErrors[currentStep] && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{stepErrors[currentStep]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          {/* Step 1: Vehicle Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Step 1: Select Vehicle</h3>
                <div>
                  <Label htmlFor="vehicleId">
                    Vehicle *
                  </Label>
                  <Input
                    as="select"
                    id="vehicleId"
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a vehicle</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} - {vehicle.make} {vehicle.model} {vehicle.year} ({vehicle.status})
                      </option>
                    ))}
                  </Input>
                  {availableVehicles.length === 0 && (
                    <p className="mt-1 text-sm text-red-600">No vehicles available for scheduling</p>
                  )}
                </div>
                
                {selectedVehicle && (
                  <div className="mt-4 bg-blue-50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Selected Vehicle Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Name:</span>
                        <span className="ml-2 font-medium">{selectedVehicle.name}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Status:</span>
                        <span className={`ml-2 font-medium capitalize ${
                          selectedVehicle.status === 'maintenance' ? 'text-yellow-600' : ''
                        }`}>
                          {selectedVehicle.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">Make/Model:</span>
                        <span className="ml-2 font-medium">{selectedVehicle.make} {selectedVehicle.model}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Year:</span>
                        <span className="ml-2 font-medium">{selectedVehicle.year}</span>
                      </div>
                    </div>
                    {selectedVehicle.status === 'maintenance' && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> This vehicle is currently undergoing maintenance. 
                          The backend will validate schedule conflicts with maintenance periods.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Date Range Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Step 2: Select Date Range</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="startDate">
                      Start Date *
                    </Label>
                    <Input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      min={getTodayString()}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">
                      End Date *
                    </Label>
                    <Input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      min={formData.startDate || getTodayString()}
                    />
                  </div>
                </div>
                
                {formData.startDate && formData.endDate && (
                  <div className="mt-4 bg-green-50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Schedule Duration</h4>
                    <p className="text-sm text-green-700">
                      {(() => {
                        const startDateObj = parseDate(formData.startDate);
                        const endDateObj = parseDateEnd(formData.endDate);
                        const diffDays = getDaysBetweenDates(startDateObj, endDateObj);
                        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Driver Selection and Notes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Step 3: Select Driver & Add Notes</h3>
                
                {/* Driver Selection */}
                <div className="mb-6">
                  <Label htmlFor="driverId">
                    Driver *
                  </Label>
                  <Input
                    as="select"
                    id="driverId"
                    name="driverId"
                    value={formData.driverId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a driver</option>
                    {data.drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} - {driver.email}
                      </option>
                    ))}
                  </Input>
                </div>
                
                {selectedDriver && (
                  <div className="mb-6 bg-purple-50 rounded-md p-4">
                    <h4 className="text-sm font-medium text-purple-900 mb-2">Selected Driver Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-purple-700">Name:</span>
                        <span className="ml-2 font-medium">{selectedDriver.name}</span>
                      </div>
                      <div>
                        <span className="text-purple-700">Email:</span>
                        <span className="ml-2 font-medium">{selectedDriver.email}</span>
                      </div>
                      <div>
                        <span className="text-purple-700">ID Number:</span>
                        <span className="ml-2 font-medium">{selectedDriver.idNumber}</span>
                      </div>
                      <div>
                        <span className="text-purple-700">Age:</span>
                        <span className="ml-2 font-medium">{selectedDriver.age || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Schedule Summary */}
                <div className="bg-gray-50 rounded-md p-4 mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule Summary</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-gray-500">Vehicle:</span>
                      <span className="ml-2 font-medium">{selectedVehicle?.name || 'Not selected'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Driver:</span>
                      <span className="ml-2 font-medium">{selectedDriver?.name || 'Not selected'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Start Date:</span>
                      <span className="ml-2 font-medium">
                        {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Not selected'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <span className="ml-2 font-medium">
                        {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Not selected'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <Label htmlFor="notes">
                    Notes (Optional)
                  </Label>
                  <Input
                    as="textarea"
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    onKeyDown={handleNotesKeyDown}
                    rows={4}
                    placeholder="Add any additional notes or special instructions for this schedule..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Press Shift+Enter for new lines. Enter alone will not submit the form.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  variant="secondary"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                to="/vehicle-schedules"
                className="btn-secondary"
              >
                Cancel
              </Link>
              
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading || !steps[currentStep - 1]?.unlocked}
                  variant="primary"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || availableVehicles.length === 0}
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="text-white mr-2" />
                      Creating Schedule...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Schedule
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}