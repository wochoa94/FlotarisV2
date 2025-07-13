import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Users, AlertTriangle, TrendingUp, Calendar, DollarSign, Wrench, Clock, Award, TrendingDown } from 'lucide-react';
import { useFleetData } from '../hooks/useFleetData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { VehicleStatusDonutChart } from '../components/charts/VehicleStatusDonutChart';
import { formatDate } from '../utils/dateUtils';

export function Dashboard() {
  const { data, loading, error } = useFleetData();

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

  const { vehicles, summary } = data;

  // Use aggregated data from backend if available, otherwise fallback to client-side calculation
  const totalVehicles = summary?.totalVehicles ?? vehicles.length;
  const totalDrivers = summary?.totalDrivers ?? data.drivers.length;
  const activeVehicles = summary?.activeVehiclesCount ?? vehicles.filter(v => v.status === 'active').length;
  const totalMaintenanceCost = summary?.totalMaintenanceCost ?? vehicles.reduce((sum, v) => sum + (v.maintenanceCost || 0), 0);
  
  // Vehicle status counts for donut chart
  const vehicleStatusCounts = summary?.vehicleStatusCounts ?? {
    active: vehicles.filter(v => v.status === 'active').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
    idle: vehicles.filter(v => v.status === 'idle').length,
  };

  // Get vehicles needing maintenance soon (within 30 days)
  const upcomingMaintenance = vehicles.filter(v => {
    if (!v.nextMaintenance) return false;
    const maintenanceDate = new Date(v.nextMaintenance);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return maintenanceDate <= thirtyDaysFromNow && maintenanceDate >= today;
  });

  const stats = [
    {
      name: 'Total Vehicles',
      value: totalVehicles,
      icon: Truck,
      color: 'bg-blue-500',
      href: '/vehicles',
    },
    {
      name: 'Active Vehicles',
      value: activeVehicles,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Total Drivers',
      value: totalDrivers,
      icon: Users,
      color: 'bg-purple-500',
      href: '/drivers',
    },
    {
      name: 'Maintenance Cost',
      value: `$${totalMaintenanceCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome to your fleet management overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );

          return stat.href ? (
            <Link key={stat.name} to={stat.href} className="block">
              {content}
            </Link>
          ) : (
            <div key={stat.name}>{content}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status Donut Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Fleet Status Overview
            </h3>
            <VehicleStatusDonutChart
              activeCount={vehicleStatusCounts.active}
              maintenanceCount={vehicleStatusCounts.maintenance}
              idleCount={vehicleStatusCounts.idle}
            />
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Upcoming Maintenance
              </h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            
            {upcomingMaintenance.length > 0 ? (
              <div className="space-y-3">
                {upcomingMaintenance.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{vehicle.name}</p>
                        <p className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {vehicle.nextMaintenance && formatDate(vehicle.nextMaintenance)}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingMaintenance.length > 5 && (
                  <div className="text-center pt-2">
                    <Link 
                      to="/vehicles" 
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      View all vehicles
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming maintenance scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Dashboard Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Orders Status */}
        {summary?.maintenanceOrdersStatusCounts && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <Wrench className="h-5 w-5 inline mr-2" />
                Maintenance Orders Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Active</span>
                  </div>
                  <span className="text-sm text-gray-500">{summary.maintenanceOrdersStatusCounts.active} orders</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Scheduled</span>
                  </div>
                  <span className="text-sm text-gray-500">{summary.maintenanceOrdersStatusCounts.scheduled} orders</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Pending Authorization</span>
                  </div>
                  <span className="text-sm text-gray-500">{summary.maintenanceOrdersStatusCounts.pending_authorization} orders</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Schedules Status */}
        {summary?.vehicleSchedulesStatusCounts && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                <Calendar className="h-5 w-5 inline mr-2" />
                Vehicle Schedules Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Active</span>
                  </div>
                  <span className="text-sm text-gray-500">{summary.vehicleSchedulesStatusCounts.active} schedules</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-gray-900">Scheduled</span>
                  </div>
                  <span className="text-sm text-gray-500">{summary.vehicleSchedulesStatusCounts.scheduled} schedules</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Maintenance Cost Leaders */}
      {(summary?.highestMaintenanceCostVehicle || summary?.lowestMaintenanceCostVehicle) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Highest Maintenance Cost Vehicle */}
          {summary?.highestMaintenanceCostVehicle && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  <Award className="h-5 w-5 inline mr-2 text-red-500" />
                  Highest Maintenance Cost
                </h3>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{summary.highestMaintenanceCostVehicle.name}</h4>
                      <p className="text-sm text-gray-600">
                        License: {summary.highestMaintenanceCostVehicle.licensePlate || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">
                        ${summary.highestMaintenanceCostVehicle.maintenanceCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Cost</div>
                    </div>
                  </div>
                  <Link
                    to={`/vehicles/${summary.highestMaintenanceCostVehicle.id}`}
                    className="mt-3 inline-flex items-center text-sm text-red-600 hover:text-red-700"
                  >
                    View Vehicle Details →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Lowest Maintenance Cost Vehicle */}
          {summary?.lowestMaintenanceCostVehicle && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  <TrendingDown className="h-5 w-5 inline mr-2 text-green-500" />
                  Lowest Maintenance Cost
                </h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{summary.lowestMaintenanceCostVehicle.name}</h4>
                      <p className="text-sm text-gray-600">
                        License: {summary.lowestMaintenanceCostVehicle.licensePlate || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${summary.lowestMaintenanceCostVehicle.maintenanceCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Cost</div>
                    </div>
                  </div>
                  <Link
                    to={`/vehicles/${summary.lowestMaintenanceCostVehicle.id}`}
                    className="mt-3 inline-flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    View Vehicle Details →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Vehicles */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Vehicles
            </h3>
            <Link 
              to="/vehicles" 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          {vehicles.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mileage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Maintenance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {vehicle.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.make} {vehicle.model} {vehicle.year}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          vehicle.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                          vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {vehicle.status === 'active' ? 'Active' : 
                           vehicle.status === 'maintenance' ? 'Maintenance' : 'Idle'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {vehicle.mileage?.toLocaleString() || 'N/A'} miles
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.nextMaintenance 
                          ? formatDate(vehicle.nextMaintenance)
                          : 'Not scheduled'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <Truck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No vehicles found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}