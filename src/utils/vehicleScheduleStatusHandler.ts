import { supabase } from '../lib/supabase';
import { VehicleSchedule } from '../types';
import { transformVehicleScheduleForDB } from './dataTransform';

interface StatusUpdate {
  type: 'vehicle_schedule';
  id: string;
  data: any;
}

/**
 * Handles automatic status updates for vehicle schedules based on dates
 * @param vehicleSchedules - Array of vehicle schedules
 * @returns Promise<StatusUpdate[]> - Array of updates that were applied
 */
export async function handleVehicleScheduleStatusUpdates(
  vehicleSchedules: VehicleSchedule[]
): Promise<StatusUpdate[]> {
  const updates: StatusUpdate[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  console.log('=== VEHICLE SCHEDULE STATUS HANDLER DEBUG ===');
  console.log('Processing', vehicleSchedules.length, 'vehicle schedules');
  console.log('Today:', today.toISOString().split('T')[0]);

  // Process each vehicle schedule for potential status updates
  for (const schedule of vehicleSchedules) {
    const startDate = new Date(schedule.startDate);
    const endDate = new Date(schedule.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999); // End of day for end date

    console.log(`Schedule ${schedule.id}:`, {
      currentStatus: schedule.status,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateReached: startDate <= today,
      endDatePassed: today > endDate
    });

    let newStatus: VehicleSchedule['status'] | null = null;

    // Check if scheduled schedule should become active
    if (schedule.status === 'scheduled' && startDate <= today && today <= endDate) {
      newStatus = 'active';
      console.log(`Schedule ${schedule.id} should change from scheduled to active`);
    }
    // Check if active schedule should become completed
    else if (schedule.status === 'active' && today > endDate) {
      newStatus = 'completed';
      console.log(`Schedule ${schedule.id} should change from active to completed`);
    }

    // If status needs to change, prepare the update
    if (newStatus) {
      const scheduleUpdateData = transformVehicleScheduleForDB({
        status: newStatus
      });

      updates.push({
        type: 'vehicle_schedule',
        id: schedule.id,
        data: scheduleUpdateData
      });

      console.log(`Prepared schedule update for ${schedule.id}:`, scheduleUpdateData);
    }
  }

  console.log('Total schedule updates to apply:', updates.length);

  // Execute all updates
  if (updates.length > 0) {
    console.log('Executing schedule updates...');
    
    for (const update of updates) {
      try {
        const { error } = await supabase
          .from('vehicle_schedules')
          .update(update.data)
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating vehicle_schedule ${update.id}:`, error);
          throw error;
        }

        console.log(`Successfully updated vehicle_schedule ${update.id}`);
      } catch (error) {
        console.error(`Failed to update vehicle_schedule ${update.id}:`, error);
        // Continue with other updates even if one fails
      }
    }
  }

  console.log('=== END VEHICLE SCHEDULE STATUS HANDLER DEBUG ===');
  return updates;
}