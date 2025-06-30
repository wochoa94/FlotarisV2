/**
 * Date utility functions for Gantt chart calculations and UI formatting
 * Updated to remove overlap validation logic (now handled by backend)
 */

import { addDays, format, differenceInDays, startOfDay, endOfDay } from 'date-fns';

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