/**
 * Date utility functions for vehicle schedule overlap checking
 */

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
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Gets today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
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