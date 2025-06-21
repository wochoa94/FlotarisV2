import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Truck, Wrench, User, MapPin, FileText, AlertTriangle } from 'lucide-react';
import { GanttItem, GanttVehicle } from '../../types';
import { 
  getToday, 
  addDaysToDate, 
  getDaysBetweenDates, 
  formatGanttDate, 
  formatTooltipDate, 
  isToday,
  parseDate,
  parseDateEnd
} from '../../utils/dateUtils';

interface GanttChartProps {
  vehicles: GanttVehicle[];
  items: GanttItem[];
  startDate?: Date;
  daysToShow?: number;
}

interface TooltipData {
  item: GanttItem;
  x: number;
  y: number;
}

const DAY_WIDTH_PX = 120;
const VEHICLE_COLUMN_WIDTH = 280;
const ROW_HEIGHT = 60;
const ITEM_HEIGHT = 24;
const ITEM_MARGIN = 4;

export function GanttChart({ 
  vehicles, 
  items, 
  startDate = getToday(), 
  daysToShow = 7 
}: GanttChartProps) {
  const [currentStartDate, setCurrentStartDate] = useState(startDate);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Generate date range for the chart
  const dateRange = Array.from({ length: daysToShow }, (_, i) => 
    addDaysToDate(currentStartDate, i)
  );

  // Calculate total chart width
  const chartWidth = daysToShow * DAY_WIDTH_PX;

  // Navigation functions
  const goToPreviousWeek = () => {
    setCurrentStartDate(addDaysToDate(currentStartDate, -7));
  };

  const goToNextWeek = () => {
    setCurrentStartDate(addDaysToDate(currentStartDate, 7));
  };

  const goToToday = () => {
    setCurrentStartDate(getToday());
  };

  // Calculate item position and width
  const calculateItemPosition = (item: GanttItem) => {
    const itemStartDate = parseDate(item.startDate);
    const itemEndDate = parseDateEnd(item.endDate);
    const chartStartDate = currentStartDate;
    const chartEndDate = addDaysToDate(currentStartDate, daysToShow - 1);

    // Check if item is visible in current date range
    if (itemEndDate < chartStartDate || itemStartDate > chartEndDate) {
      return null; // Item is outside visible range
    }

    // Calculate visible start and end dates
    const visibleStartDate = itemStartDate < chartStartDate ? chartStartDate : itemStartDate;
    const visibleEndDate = itemEndDate > chartEndDate ? chartEndDate : itemEndDate;

    // Calculate position and width
    const daysFromStart = getDaysBetweenDates(chartStartDate, visibleStartDate) - 1;
    const visibleDays = getDaysBetweenDates(visibleStartDate, visibleEndDate);

    const left = Math.max(0, daysFromStart * DAY_WIDTH_PX);
    const width = Math.max(20, visibleDays * DAY_WIDTH_PX - 2); // Minimum width of 20px

    return { left, width };
  };

  // Group items by vehicle
  const itemsByVehicle = items.reduce((acc, item) => {
    if (!acc[item.vehicleId]) {
      acc[item.vehicleId] = [];
    }
    acc[item.vehicleId].push(item);
    return acc;
  }, {} as Record<string, GanttItem[]>);

  // Handle item hover
  const handleItemMouseEnter = (event: React.MouseEvent, item: GanttItem) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      item,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleItemMouseLeave = () => {
    setTooltip(null);
  };

  // Handle keyboard navigation
  const handleItemKeyDown = (event: React.KeyboardEvent, item: GanttItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Could trigger a detail modal or navigation here
      console.log('Item selected:', item);
    }
  };

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = dateRange.findIndex(date => isToday(date));
      if (todayIndex >= 0) {
        const scrollPosition = Math.max(0, todayIndex * DAY_WIDTH_PX - 200);
        scrollContainerRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [currentStartDate]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Schedule Timeline
          </h3>
          <div className="text-sm text-gray-600">
            {format(currentStartDate, 'MMM dd')} - {format(addDaysToDate(currentStartDate, daysToShow - 1), 'MMM dd, yyyy')}
          </div>
        </div>
        
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

      {/* Main Gantt Chart Container with Scrolling */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-auto max-h-96 relative"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Date Headers - Sticky to top during vertical scroll */}
        <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0 z-30">
          {/* Vehicle Column Header - Sticky to left and top */}
          <div 
            className="flex-shrink-0 border-r border-gray-200 bg-gray-100 sticky left-0 z-40"
            style={{ width: VEHICLE_COLUMN_WIDTH }}
          >
            <div className="p-3 font-semibold text-gray-900 text-sm">
              Vehicles ({vehicles.length})
            </div>
          </div>
          
          {/* Date Headers - Scroll horizontally */}
          <div 
            className="flex"
            style={{ width: chartWidth }}
          >
            {dateRange.map((date, index) => (
              <div
                key={index}
                className={`flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-medium ${
                  isToday(date) 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'text-gray-700'
                }`}
                style={{ width: DAY_WIDTH_PX }}
              >
                <div>{formatGanttDate(date)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {format(date, 'EEE')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Rows Content */}
        <div className="relative">
          {vehicles.map((vehicle, vehicleIndex) => {
            const vehicleItems = itemsByVehicle[vehicle.id] || [];
            
            return (
              <div
                key={vehicle.id}
                className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                style={{ height: ROW_HEIGHT }}
              >
                {/* Vehicle Info Column - Sticky to left */}
                <div 
                  className="flex-shrink-0 border-r border-gray-200 bg-white sticky left-0 z-20 flex items-center"
                  style={{ width: VEHICLE_COLUMN_WIDTH }}
                >
                  <div className="p-3 w-full">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          vehicle.status === 'active' ? 'bg-green-500' :
                          vehicle.status === 'maintenance' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {vehicle.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {vehicle.make} {vehicle.model} {vehicle.year}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Area - Scrolls horizontally */}
                <div 
                  className="relative flex-shrink-0"
                  style={{ width: chartWidth }}
                >
                  {/* Today Indicator */}
                  {dateRange.map((date, dateIndex) => (
                    isToday(date) && (
                      <div
                        key={`today-${dateIndex}`}
                        className="absolute top-0 bottom-0 bg-blue-100 border-l-2 border-blue-400 opacity-50 pointer-events-none"
                        style={{
                          left: dateIndex * DAY_WIDTH_PX,
                          width: DAY_WIDTH_PX
                        }}
                      />
                    )
                  ))}

                  {/* Schedule and Maintenance Items */}
                  {vehicleItems.map((item, itemIndex) => {
                    const position = calculateItemPosition(item);
                    if (!position) return null;

                    const isSchedule = item.type === 'schedule';
                    const isMaintenance = item.type === 'maintenance';
                    const isCompleted = item.details.status === 'completed';

                    return (
                      <div
                        key={item.id}
                        className={`absolute rounded-md shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:z-10 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          isCompleted
                            ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
                            : isSchedule 
                              ? 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500' 
                              : 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'
                        }`}
                        style={{
                          left: position.left,
                          width: position.width,
                          top: ITEM_MARGIN + (itemIndex % 2) * (ITEM_HEIGHT + ITEM_MARGIN),
                          height: ITEM_HEIGHT
                        }}
                        onMouseEnter={(e) => handleItemMouseEnter(e, item)}
                        onMouseLeave={handleItemMouseLeave}
                        onKeyDown={(e) => handleItemKeyDown(e, item)}
                        tabIndex={0}
                        role="button"
                        aria-label={`${item.type}: ${item.title}`}
                      >
                        <div className="flex items-center h-full px-2 text-white text-xs font-medium">
                          <div className="flex items-center space-x-1 truncate">
                            {isSchedule ? (
                              <Truck className="h-3 w-3 flex-shrink-0" />
                            ) : (
                              <Wrench className="h-3 w-3 flex-shrink-0" />
                            )}
                            <span className="truncate">{item.title}</span>
                            {item.details.urgent && (
                              <AlertTriangle className="h-3 w-3 flex-shrink-0 text-red-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {vehicles.length === 0 && (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No vehicles found</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {tooltip.item.type === 'schedule' ? (
                <Truck className="h-4 w-4 text-blue-400" />
              ) : (
                <Wrench className="h-4 w-4 text-amber-400" />
              )}
              <span className="font-semibold">{tooltip.item.title}</span>
              {tooltip.item.details.urgent && (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              )}
            </div>
            
            <div className="text-gray-300 space-y-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3" />
                <span>
                  {formatTooltipDate(tooltip.item.startDate)} - {formatTooltipDate(tooltip.item.endDate)}
                </span>
              </div>
              
              {tooltip.item.details.driverName && (
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span>{tooltip.item.details.driverName}</span>
                </div>
              )}
              
              {tooltip.item.details.location && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-3 w-3" />
                  <span>{tooltip.item.details.location}</span>
                </div>
              )}
              
              {tooltip.item.details.description && (
                <div className="flex items-start space-x-2">
                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{tooltip.item.details.description}</span>
                </div>
              )}
              
              <div className="text-xs text-gray-400 capitalize">
                Status: {tooltip.item.details.status}
              </div>
            </div>
          </div>
          
          {/* Tooltip Arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          />
        </div>
      )}
    </div>
  );
}