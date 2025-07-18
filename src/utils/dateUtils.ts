/**
 * Date utility functions for Gantt chart calculations and UI formatting
 * Updated to handle all dates in Guatemala timezone (America/Guatemala)
 */

import { addDays, format, differenceInDays, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { GUATEMALA_TIMEZONE } from '../lib/constants';

/**
 * Formats a date string for display in Guatemala timezone
 * Handles both YYYY-MM-DD strings (from date type columns) and ISO timestamp strings
 * @param dateString - Date string (YYYY-MM-DD or ISO format)
 * @returns Formatted date string in Guatemala timezone
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString); // Parse the date string (handles both YYYY-MM-DD and ISO)
  return formatInTimeZone(date, GUATEMALA_TIMEZONE, 'MMM dd, yyyy');
}

/**
 * Gets today's date in YYYY-MM-DD format based on Guatemala timezone
 * @returns Today's date string in Guatemala timezone
 */
export function getTodayString(): string {
  const nowInGuatemala = toZonedTime(new Date(), GUATEMALA_TIMEZONE);
  return formatInTimeZone(nowInGuatemala, GUATEMALA_TIMEZONE, 'yyyy-MM-dd');
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
 * Gets today's date as a Date object in Guatemala timezone
 * @returns Today's date at start of day in Guatemala timezone
 */
export function getToday(): Date {
  const nowInGuatemala = toZonedTime(new Date(), GUATEMALA_TIMEZONE);
  return startOfDay(nowInGuatemala);
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
 * Formats a date for display in the Gantt chart header in Guatemala timezone
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatGanttDate(date: Date): string {
  return formatInTimeZone(date, GUATEMALA_TIMEZONE, 'MMM dd');
}

/**
 * Formats a date for display in tooltips in Guatemala timezone
 * Handles both YYYY-MM-DD strings and ISO timestamp strings
 * @param dateString - Date string
 * @returns Formatted date string in Guatemala timezone
 */
export function formatTooltipDate(dateString: string): string {
  const date = new Date(dateString);
  return formatInTimeZone(date, GUATEMALA_TIMEZONE, 'MMM dd, yyyy');
}

/**
 * Checks if a date is today in Guatemala timezone
 * @param date - Date to check
 * @returns True if date is today in Guatemala timezone
 */
export function isToday(date: Date): boolean {
  const todayInGuatemala = getToday();
  return formatInTimeZone(date, GUATEMALA_TIMEZONE, 'yyyy-MM-dd') === 
         formatInTimeZone(todayInGuatemala, GUATEMALA_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Converts a date string to a Date object at start of day in Guatemala timezone
 * Handles both YYYY-MM-DD strings and ISO timestamp strings
 * @param dateString - Date string
 * @returns Date object representing start of day in Guatemala timezone
 */
export function parseDate(dateString: string): Date {
  // For YYYY-MM-DD format, create a Date object that represents that date in Guatemala timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a Date object representing midnight of that date in Guatemala timezone
    const dateInGuatemala = new Date(year, month - 1, day, 0, 0, 0);
    // Convert to Guatemala timezone and ensure it's at start of day
    const zonedDate = toZonedTime(dateInGuatemala, GUATEMALA_TIMEZONE);
    return startOfDay(zonedDate);
  }
  
  // For ISO timestamp strings, parse as UTC and then convert to Guatemala timezone
  const date = new Date(dateString);
  const zonedDate = toZonedTime(date, GUATEMALA_TIMEZONE);
  return startOfDay(zonedDate);
}

/**
 * Converts a date string to a Date object at end of day in Guatemala timezone
 * Handles both YYYY-MM-DD strings and ISO timestamp strings
 * @param dateString - Date string
 * @returns Date object representing end of day in Guatemala timezone
 */
export function parseDateEnd(dateString: string): Date {
  // For YYYY-MM-DD format, create a Date object that represents that date in Guatemala timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    // Create a Date object representing midnight of that date in Guatemala timezone
    const dateInGuatemala = new Date(year, month - 1, day, 0, 0, 0);
    // Convert to Guatemala timezone and ensure it's at end of day
    const zonedDate = toZonedTime(dateInGuatemala, GUATEMALA_TIMEZONE);
    return endOfDay(zonedDate);
  }
  
  // For ISO timestamp strings, parse as UTC and then convert to Guatemala timezone
  const date = new Date(dateString);
  const zonedDate = toZonedTime(date, GUATEMALA_TIMEZONE);
  return endOfDay(zonedDate);
}

/**
 * Formats a UTC date string to Guatemala YYYY-MM-DD for date inputs
 * Ensures UTC dates are displayed as the intended Guatemala day for input fields
 * @param utcDateString - UTC ISO date string
 * @returns Guatemala YYYY-MM-DD string
 */
export function formatUtcDateForInput(utcDateString: string): string {
  const date = new Date(utcDateString); // Parse as UTC
  return formatInTimeZone(date, GUATEMALA_TIMEZONE, 'yyyy-MM-dd'); // Format in Guatemala timezone
}

/**
 * Converts a Guatemala YYYY-MM-DD date to UTC midnight for database storage
 * Interprets the input as a date in Guatemala timezone and converts to UTC ISO
 * @param localDateString - Guatemala YYYY-MM-DD string
 * @returns UTC ISO string representing midnight in Guatemala timezone
 */
export function convertLocalDateToUtcMidnight(localDateString: string): string {
  // Create a Date object representing midnight of localDateString in Guatemala timezone
  const [year, month, day] = localDateString.split('-').map(Number);
  // Create a Date object in Guatemala timezone
  const dateInGuatemala = new Date(year, month - 1, day, 0, 0, 0);
  // Convert this Guatemala-local date to UTC
  const utcDate = fromZonedTime(dateInGuatemala, GUATEMALA_TIMEZONE);
  return utcDate.toISOString(); // Return as ISO string (which is UTC)
}