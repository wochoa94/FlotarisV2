import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Truck, Wrench, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGanttChartData } from '../hooks/useGanttChartData';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { GanttChart } from '../components/gantt/GanttChart';
import { getToday, addDaysToDate, formatGanttDate } from '../utils/dateUtils';
import { format } from 'date-fns';

export function SchedulesOverview() {
  // Date control state
  const [currentStartDate, setCurrentStartDate] = useState(getToday());
  const [daysToShow, setDaysToShow] = useState(7);

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
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Date Selection */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={format(currentStartDate, 'yyyy-MM-dd')}
                onChange={handleStartDateChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Days to Show Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Duration
              </label>
              <div className="flex space-x-2">
                {[
                  { value: 7, label: '1 Week' },
                  { value: 14, label: '2 Weeks' },
                  { value: 30, label: '1 Month' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleDaysToShowChange(option.value)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      daysToShow === option.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quick Navigation
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  title="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
                >
                  Today
                </button>
                
                <button
                  onClick={goToNextWeek}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  title="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Range Display */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Current Range:</span> {formatGanttDate(currentStartDate)} - {formatGanttDate(addDaysToDate(currentStartDate, daysToShow - 1))}
              {loading && (
                <span className="ml-4 inline-flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Loading data...
                </span>
              )}
            </div>
          </div>
        </div>
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

      {/* Gantt Chart */}
      <GanttChart
        vehicles={ganttVehicles}
        items={ganttItems}
        startDate={currentStartDate}
        daysToShow={daysToShow}
      />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">How to use the timeline</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the date picker to jump to any specific date</li>
          <li>• Select different view durations (1 Week, 2 Weeks, 1 Month)</li>
          <li>• Use the navigation arrows to move between periods</li>
          <li>• Click "Today" to jump to the current date</li>
          <li>• Hover over schedule blocks to see detailed information</li>
          <li>• Use keyboard navigation (Tab and Enter) for accessibility</li>
          <li>• Scroll horizontally to see more dates within the selected range</li>
          <li>• Completed items are shown in grey for historical reference</li>
        </ul>
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
    </div>
  );
}