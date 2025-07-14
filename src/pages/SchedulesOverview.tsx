import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Truck, Wrench, AlertTriangle, Settings } from 'lucide-react';
import { useGanttChartData } from '../hooks/useGanttChartData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GanttChart } from '../components/gantt/GanttChart';
import { getToday, addDaysToDate } from '../utils/dateUtils';
import { DateNavigationModal } from '../components/modals/DateNavigationModal';

export function SchedulesOverview() {
  // Date control state
  const [currentStartDate, setCurrentStartDate] = useState(getToday());
  const [daysToShow, setDaysToShow] = useState(7);
  const [showDateNavigationModal, setShowDateNavigationModal] = useState(false);

  // Fetch Gantt chart data using the dedicated hook
  const { ganttVehicles, ganttItems, stats, loading, error, refreshGanttData } = useGanttChartData(
    currentStartDate,
    daysToShow
  );

  // Refresh data when component mounts
  useEffect(() => {
    refreshGanttData();
  }, [refreshGanttData]);

  // Date navigation functions
  const goToPreviousWeek = () => {
    setCurrentStartDate(addDaysToDate(currentStartDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentStartDate(addDaysToDate(currentStartDate, 7));
  };

  const goToToday = () => {
    setCurrentStartDate(getToday());
  };

  // Handle manual date selection
  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      setCurrentStartDate(newDate);
    }
  };

  // Handle days to show selection
  const handleDaysToShowChange = (newDaysToShow: number) => {
    setDaysToShow(newDaysToShow);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedules Overview</h1>
          <p className="mt-1 text-sm text-gray-600">
            Interactive timeline view of vehicle schedules and maintenance orders
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-red-800">
              <h3 className="font-medium">Error loading schedules overview</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={refreshGanttData}
              className="text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              <AlertTriangle className="h-5 w-5" />
            </button>
          </div>
        </div>
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

      {/* Enhanced Date Range Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {loading && (
            <span className="inline-flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Loading data...
            </span>
          )}
        </div>
        <button
          onClick={() => setShowDateNavigationModal(true)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          <Settings className="h-4 w-4 mr-2" />
          Date Navigation
        </button>
      </div>

      {/* Gantt Chart */}
      <GanttChart
        vehicles={ganttVehicles}
        items={ganttItems}
        startDate={currentStartDate}
        daysToShow={daysToShow}
      />

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
            <span className="text-sm text-gray-700">Scheduled/Active Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-50 rounded border border-gray-300"></div>
            <span className="text-sm text-gray-700">Pending Authorization Maintenance</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-500 rounded"></div>
            <span className="text-sm text-gray-700">Completed Items</span>
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

      {/* Empty State */}
      {ganttItems.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules or maintenance orders</h3>
          <p className="text-gray-500 mb-4">
            There are currently no items to display in the selected date range.
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

      {/* Date Navigation Modal */}
      <DateNavigationModal
        isOpen={showDateNavigationModal}
        onClose={() => setShowDateNavigationModal(false)}
        currentStartDate={currentStartDate}
        daysToShow={daysToShow}
        onStartDateChange={handleStartDateChange}
        onDaysToShowChange={handleDaysToShowChange}
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        onGoToToday={goToToday}
      />
    </div>
  );
}