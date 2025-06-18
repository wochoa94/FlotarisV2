import React, { useMemo } from 'react';
import { Calendar, TrendingUp, Truck, Wrench, AlertTriangle } from 'lucide-react';
import { useFleetData } from '../hooks/useFleetData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GanttChart } from '../components/gantt/GanttChart';
import { GanttItem, GanttVehicle } from '../types';
import { getToday, addDaysToDate } from '../utils/dateUtils';

export function SchedulesOverview() {
  const { data, loading, error } = useFleetData();

  // Transform fleet data into Gantt chart format
  const { ganttVehicles, ganttItems, stats } = useMemo(() => {
    if (!data) {
      return { ganttVehicles: [], ganttItems: [], stats: { totalItems: 0, activeSchedules: 0, activeMaintenance: 0, urgentItems: 0 } };
    }

    const { vehicles, drivers, maintenanceOrders, vehicleSchedules } = data;

    // Transform vehicles for Gantt chart
    const ganttVehicles: GanttVehicle[] = vehicles.map(vehicle => ({
      id: vehicle.id,
      name: vehicle.name,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status
    }));

    // Transform vehicle schedules into Gantt items
    const scheduleItems: GanttItem[] = vehicleSchedules
      .filter(schedule => schedule.status !== 'completed') // Only show active and scheduled
      .map(schedule => {
        const driver = drivers.find(d => d.id === schedule.driverId);
        
        return {
          id: schedule.id,
          vehicleId: schedule.vehicleId,
          type: 'schedule' as const,
          title: driver ? driver.name : 'Unknown Driver',
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          color: '#1976D2', // Blue color for schedules
          details: {
            driverName: driver?.name,
            status: schedule.status,
            notes: schedule.notes || undefined
          }
        };
      });

    // Transform maintenance orders into Gantt items
    const maintenanceItems: GanttItem[] = maintenanceOrders
      .filter(order => order.status !== 'completed') // Only show pending, scheduled, and active
      .map(order => ({
        id: order.id,
        vehicleId: order.vehicleId,
        type: 'maintenance' as const,
        title: order.orderNumber,
        startDate: order.startDate,
        endDate: order.estimatedCompletionDate,
        color: '#FFC107', // Amber color for maintenance
        details: {
          orderNumber: order.orderNumber,
          description: order.description || undefined,
          status: order.status,
          urgent: order.urgent || false,
          location: order.location || undefined
        }
      }));

    // Combine all items
    const ganttItems = [...scheduleItems, ...maintenanceItems];

    // Calculate statistics
    const stats = {
      totalItems: ganttItems.length,
      activeSchedules: scheduleItems.filter(item => item.details.status === 'active').length,
      activeMaintenance: maintenanceItems.filter(item => item.details.status === 'active').length,
      urgentItems: ganttItems.filter(item => item.details.urgent).length
    };

    return { ganttVehicles, ganttItems, stats };
  }, [data]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Schedules Overview</h1>
        <p className="mt-1 text-sm text-gray-600">
          Interactive timeline view of vehicle schedules and maintenance orders
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-blue-500 p-3 rounded-md">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-green-500 p-3 rounded-md">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Schedules</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeSchedules}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-amber-500 p-3 rounded-md">
                  <Wrench className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Maintenance</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeMaintenance}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="bg-red-500 p-3 rounded-md">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Urgent Items</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.urgentItems}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Vehicle Schedules</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-sm text-gray-700">Maintenance Orders</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Active Vehicle</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Maintenance Vehicle</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Idle Vehicle</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-gray-700">Urgent</span>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <GanttChart
        vehicles={ganttVehicles}
        items={ganttItems}
        startDate={getToday()}
        daysToShow={7}
      />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How to use the timeline</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the navigation arrows to move between weeks</li>
          <li>• Click "Today" to jump to the current date</li>
          <li>• Hover over schedule blocks to see detailed information</li>
          <li>• Use keyboard navigation (Tab and Enter) for accessibility</li>
          <li>• Scroll horizontally to see more dates</li>
        </ul>
      </div>

      {/* Empty State */}
      {ganttItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules or maintenance orders</h3>
          <p className="text-gray-500 mb-4">
            There are currently no active or scheduled items to display in the timeline.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/vehicle-schedules/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Truck className="h-4 w-4 mr-2" />
              Create Schedule
            </a>
            <a
              href="/maintenance-orders/new"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Create Maintenance Order
            </a>
          </div>
        </div>
      )}
    </div>
  );
}