import React from 'react';

interface VehicleStatusDonutChartProps {
  activeCount: number;
  maintenanceCount: number;
  idleCount: number;
}

export function VehicleStatusDonutChart({ 
  activeCount, 
  maintenanceCount, 
  idleCount 
}: VehicleStatusDonutChartProps) {
  const total = activeCount + maintenanceCount + idleCount;
  
  // If no data, show empty state
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-gray-200"></div>
          <p className="text-sm text-gray-500">No vehicle data available</p>
        </div>
      </div>
    );
  }

  // Calculate percentages and angles
  const activePercentage = (activeCount / total) * 100;
  const maintenancePercentage = (maintenanceCount / total) * 100;
  const idlePercentage = (idleCount / total) * 100;

  // SVG circle parameters
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke dash arrays for each segment
  const activeStroke = (activePercentage / 100) * circumference;
  const maintenanceStroke = (maintenancePercentage / 100) * circumference;
  const idleStroke = (idlePercentage / 100) * circumference;

  // Calculate rotation offsets
  const activeOffset = 0;
  const maintenanceOffset = activeStroke;
  const idleOffset = activeStroke + maintenanceStroke;

  return (
    <div className="flex items-center justify-center">
      <div className="relative">
        {/* SVG Donut Chart */}
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
          
          {/* Active segment */}
          {activeCount > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${activeStroke} ${circumference - activeStroke}`}
              strokeDashoffset={-activeOffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          )}
          
          {/* Maintenance segment */}
          {maintenanceCount > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${maintenanceStroke} ${circumference - maintenanceStroke}`}
              strokeDashoffset={-maintenanceOffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          )}
          
          {/* Idle segment */}
          {idleCount > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${idleStroke} ${circumference - idleStroke}`}
              strokeDashoffset={-idleOffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-in-out"
            />
          )}
        </svg>

        {/* Center text showing total */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total Vehicles</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="ml-6 space-y-3">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Active</div>
            <div className="text-gray-500">{activeCount} vehicles ({activePercentage.toFixed(1)}%)</div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Maintenance</div>
            <div className="text-gray-500">{maintenanceCount} vehicles ({maintenancePercentage.toFixed(1)}%)</div>
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
          <div className="text-sm">
            <div className="font-medium text-gray-900">Idle</div>
            <div className="text-gray-500">{idleCount} vehicles ({idlePercentage.toFixed(1)}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}