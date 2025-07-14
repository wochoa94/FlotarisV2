import React from 'react';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { addDaysToDate, formatGanttDate } from '../../utils/dateUtils';

interface DateNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStartDate: Date;
  daysToShow: number;
  onStartDateChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDaysToShowChange: (newDaysToShow: number) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
}

export function DateNavigationModal({
  isOpen,
  onClose,
  currentStartDate,
  daysToShow,
  onStartDateChange,
  onDaysToShowChange,
  onPreviousWeek,
  onNextWeek,
  onGoToToday,
}: DateNavigationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="px-4 py-5 sm:p-6">
          {/* Modal Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Date Navigation</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Date Navigation Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Date Selection */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={format(currentStartDate, 'yyyy-MM-dd')}
                onChange={onStartDateChange}
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
                    onClick={() => onDaysToShowChange(option.value)}
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
                  onClick={onPreviousWeek}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  title="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <button
                  onClick={onGoToToday}
                  className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
                >
                  Today
                </button>
                
                <button
                  onClick={onNextWeek}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
                  title="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Range Display */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Current Range:</span> {formatGanttDate(currentStartDate)} - {formatGanttDate(addDaysToDate(currentStartDate, daysToShow - 1))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex items-center justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}