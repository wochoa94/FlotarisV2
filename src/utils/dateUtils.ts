/**
 * Date utility functions for vehicle schedule overlap checking and Gantt chart calculations
 * Updated to handle consistent date interpretation for PostgreSQL date types
 */

import { addDays, format, differenceInDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Checks if a date range overlaps with another date range
 * @param range1Start - Start date of first range
 * @param range1End - End date of first range
 * @param range2Start - Start date of second range
 * @param range2End - End date of second range
 * @returns boolean - True if ranges overlap
 */
export function isWithin(
  range1Start: string | Date,
  range1End: string | Date,
  range2Start: string | Date,
  range2End: string | Date
): boolean {
  const start1 = new Date(range1Start);
  const end1 = new Date(range1End);
  const start2 = new Date(range2Start);
  const end2 = new Date(range2End);

  // Set times to ensure proper date comparison
  start1.setHours(0, 0, 0, 0);
  end1.setHours(23, 59, 59, 999);
  start2.setHours(0, 0, 0, 0);
  end2.setHours(23, 59, 59, 999);

  // Check if ranges overlap
  return start1 <= end2 && end1 >= start2;
}

/**
 * Checks if a new date range overlaps with any existing schedules
 * @param newStartDate - Start date of new range
 * @param newEndDate - End date of new range
 * @param existingItems - Array of items with startDate and endDate properties
 * @param statusFilter - Optional array of statuses to check (defaults to ['active', 'scheduled'])
 * @returns boolean - True if overlap detected
 */
export function isOverlap(
  newStartDate: string,
  newEndDate: string,
  existingItems: Array<{ startDate: string; endDate: string; status: string }>,
  statusFilter: string[] = ['active', 'scheduled']
): boolean {
  return existingItems.some(item => {
    // Only check items with specified statuses
    if (!statusFilter.includes(item.status)) {
      return false;
    }

    return isWithin(newStartDate, newEndDate, item.startDate, item.endDate);
  });
}

/**
 * Checks if a new maintenance order date range overlaps with existing orders
 * @param newStartDate - Start date of new maintenance order
 * @param newEndDate - End date of new maintenance order
 * @param existingOrders - Array of maintenance orders
 * @param statusFilter - Optional array of statuses to check
 * @returns boolean - True if overlap detected
 */
export function isMaintenanceOverlap(
  newStartDate: string,
  newEndDate: string,
  existingOrders: Array<{ startDate: string; estimatedCompletionDate: string; status: string }>,
  statusFilter: string[] = ['active', 'scheduled']
): boolean {
  return existingOrders.some(order => {
    // Only check orders with specified statuses
    if (!statusFilter.includes(order.status)) {
      return false;
    }

    return isWithin(newStartDate, newEndDate, order.startDate, order.estimatedCompletionDate);
  });
}

/**
 * Formats a date string for display
 * Handles both YYYY-MM-DD strings (from date type columns) and ISO timestamp strings
 * @param dateString - Date string (YYYY-MM-DD or ISO format)
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  // For YYYY-MM-DD format (from PostgreSQL date types), create date in local timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  // For ISO timestamp strings, use standard Date parsing
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Gets today's date in YYYY-MM-DD format based on local timezone
 * @returns Today's date string
 */
export function getTodayString(): string {
  return format(new Date(), 'yyyy-MM-dd'); // Use date-fns format for local date
}

/**
 * Calculates the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Gantt Chart specific date utilities

/**
 * Gets today's date as a Date object
 * @returns Today's date
 */
export function getToday(): Date {
  return startOfDay(new Date());
}

/**
 * Adds specified number of days to a date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Gets the number of days between two dates (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days
 */
export function getDaysBetweenDates(startDate: Date, endDate: Date): number {
  return Math.abs(differenceInDays(endDate, startDate)) + 1;
}

/**
 * Formats a date for display in the Gantt chart header
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatGanttDate(date: Date): string {
  return format(date, 'MMM dd');
}

/**
 * Formats a date for display in tooltips
 * Handles both YYYY-MM-DD strings and ISO timestamp strings
 * @param dateString - Date string
 * @returns Formatted date string
 */
export function formatTooltipDate(dateString: string): string {
  // For YYYY-MM-DD format (from PostgreSQL date types), create date in local timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript
    return format(date, 'MMM dd, yyyy');
  }
  
  // For ISO timestamp strings, use standard Date parsing
  return format(new Date(dateString), 'MMM dd, yyyy');
}

/**
 * Checks if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = getToday();
  return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
}

/**
 * Converts a date string to a Date object at start of day
 * Handles both YYYY-MM-DD strings and ISO timestamp strings
 * @param dateString - Date string
 * @returns Date object
 */
export function parseDate(dateString: string): Date {
  // For YYYY-MM-DD format (from PostgreSQL date types), create date in local timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return startOfDay(new Date(year, month - 1, day)); // month is 0-indexed in JavaScript
  }
  
  // For ISO timestamp strings, use standard Date parsing
  return startOfDay(new Date(dateString));
}

/**
 * Converts a date string to a Date object at end of day
 * Handles both YYYY-MM-DD strings and ISO timestamp strings
 * @param dateString - Date string
 * @returns Date object
 */
export function parseDateEnd(dateString: string): Date {
  // For YYYY-MM-DD format (from PostgreSQL date types), create date in local timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return endOfDay(new Date(year, month - 1, day)); // month is 0-indexed in JavaScript
  }
  
  // For ISO timestamp strings, use standard Date parsing
  return endOfDay(new Date(dateString));
}

/**
 * Formats a UTC date string to local YYYY-MM-DD for date inputs
 * @param utcDateString - UTC ISO date string
 * @returns Local YYYY-MM-DD string
 */
export function formatUtcDateForInput(utcDateString: string): string {
  return format(new Date(utcDateString), 'yyyy-MM-dd');
}

/**
 * Converts a local YYYY-MM-DD date to UTC midnight for database storage
 * @param localDateString - Local YYYY-MM-DD string
 * @returns UTC ISO string with midnight time
 */
export function convertLocalDateToUtcMidnight(localDateString: string): string {
  return `${localDateString}T00:00:00Z`;
}