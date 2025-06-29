import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Clock, DollarSign, Truck, FileText, User, MapPin, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useFleetData } from '../hooks/useFleetData';
import { useAuth } from '../hooks/useAuth';
import { maintenanceOrderService } from '../services/apiService';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AuthorizeMaintenanceOrderModal } from '../components/modals/AuthorizeMaintenanceOrderModal';

// Status badge component for maintenance orders
function MaintenanceStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    pending_authorization: {
      label: 'Pending Authorization',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    completed: {
      label: 'Completed',
      className: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}

export function MaintenanceOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refreshData } = useFleetData();
  const { user } = useAuth();

  const [showAuthorizeModal, setShowAuthorizeModal] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
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

  const handleAuthorize = async (authData: { cost: number; quotationDetails: string; comments: string }) => {
    if (!order) return;

    setIsAuthorizing(true);
    setErrorMessage('');

    try {
      // Update maintenance order status and details via API service
      await maintenanceOrderService.updateMaintenanceOrderStatus(order.id, 'scheduled', {
        cost: authData.cost,
        quotationDetails: authData.quotationDetails,
        comments: authData.comments,
      });

      // Success feedback
      setSuccessMessage('Maintenance order authorized successfully! Status changed to Scheduled.');
      
      // Refresh fleet data
      await refreshData();
      
      // Close modal
      setShowAuthorizeModal(false);

    } catch (error) {
      console.error('Error authorizing maintenance order:', error);
      setErrorMessage(
        error instanceof Error 
          ? `Failed to authorize maintenance order: ${error.message}`
          : 'Failed to authorize maintenance order. Please try again.'
      );
    } finally {
      setIsAuthorizing(false);
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

  const order = data.maintenanceOrders.find(o => o.id === id);
  const vehicle = order ? data.vehicles.find(v => v.id === order.vehicleId) : null;
  const assignedDriver = vehicle?.assignedDriverId 
    ? data.drivers.find(d => d.id === vehicle.assignedDriverId)
    : null;

  // DEBUG LOGS - Added here to inspect values
  console.log('=== DEBUG LOGS FOR MAINTENANCE ORDER DETAIL ===');
  console.log('user object:', user);
  console.log('user?.isAdmin:', user?.isAdmin);
  console.log('order object:', order);
  console.log('order?.status:', order?.status);
  console.log('Combined condition (user?.isAdmin && order?.status === "pending_authorization"):', 
    user?.isAdmin && order?.status === 'pending_authorization');
  console.log('=== END DEBUG LOGS ===');

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
            onClick={() => navigate('/maintenance-orders')}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Maintenance Orders
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-600">
              {vehicle ? `${vehicle.name} - ${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {user?.isAdmin && (
            <Link
              to={`/maintenance-orders/${order.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Link>
          )}
          
          {/* Authorize Order Button - Only show for admins and pending authorization orders */}
          {user?.isAdmin && order.status === 'pending_authorization' && (
            <button
              onClick={() => setShowAuthorizeModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Authorize Order
            </button>
          )}
        </div>
      </div>

      {/* Status and Key Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                  <dd className="mt-1">
                    <MaintenanceStatusBadge status={order.status} />
                    {order.urgent && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Urgent
                        </span>
                      </div>
                    )}
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
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Start Date</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Date(order.startDate).toLocaleDateString()}
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
                <Clock className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Est. Completion</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {new Date(order.estimatedCompletionDate).toLocaleDateString()}
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
                <DollarSign className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Cost</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {order.cost ? `$${order.cost.toLocaleString()}` : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Order Information
            </h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{order.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <MaintenanceStatusBadge status={order.status} />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(order.startDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Estimated Completion Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(order.estimatedCompletionDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.location ? (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      {order.location}
                    </div>
                  ) : (
                    'Not specified'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.type || 'Not specified'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Priority</dt>
                <dd className="mt-1">
                  {order.urgent ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent
                    </span>
                  ) : (
                    <span className="text-sm text-gray-900">Normal</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Cost</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.cost ? `$${order.cost.toLocaleString()}` : 'Not specified'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(order.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <Truck className="h-5 w-5 inline mr-2" />
              Vehicle Information
            </h3>
            {vehicle ? (
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Vehicle Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{vehicle.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Make/Model/Year</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {vehicle.make} {vehicle.model} {vehicle.year}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">License Plate</dt>
                  <dd className="mt-1 text-sm text-gray-900">{vehicle.licensePlate || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">VIN</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{vehicle.vin || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Current Mileage</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {vehicle.mileage?.toLocaleString() || 'N/A'} miles
                  </dd>
                </div>
                <div className="pt-4">
                  <Link
                    to={`/vehicles/${vehicle.id}`}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Vehicle Details
                  </Link>
                </div>
              </dl>
            ) : (
              <p className="text-gray-500">Vehicle information not available</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Description */}
      {order.description && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Service Description
            </h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Details */}
      {order.quotationDetails && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quotation Details
            </h3>
            <div className="bg-blue-50 rounded-md p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.quotationDetails}</p>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {order.comments && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Comments
            </h3>
            <div className="bg-yellow-50 rounded-md p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{order.comments}</p>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Driver */}
      {assignedDriver && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              <User className="h-5 w-5 inline mr-2" />
              Assigned Driver
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

      {/* Authorization Modal */}
      <AuthorizeMaintenanceOrderModal
        isOpen={showAuthorizeModal}
        onClose={() => setShowAuthorizeModal(false)}
        onAuthorize={handleAuthorize}
        order={order}
        isLoading={isAuthorizing}
      />
    </div>
  );
}