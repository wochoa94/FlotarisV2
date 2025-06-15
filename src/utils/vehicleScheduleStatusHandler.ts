import { supabase } from '../lib/supabase';
import { VehicleSchedule, Vehicle } from '../types';
import { transformVehicleScheduleForDB, transformVehicleForDB } from './dataTransform';

interface StatusUpdate {
  type: 'vehicle_schedule' | 'vehicle';
  id: string;
  data: any;
}

/**
 * Handles automatic status updates for vehicle schedules and their associated vehicles based on dates
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
      vehicleId: schedule.vehicleId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateReached: startDate <= today,
      endDatePassed: today > endDate
    });

    let newScheduleStatus: VehicleSchedule['status'] | null = null;
    let shouldUpdateVehicle = false;

    // Check if scheduled schedule should become active
    if (schedule.status === 'scheduled' && startDate <= today && today <= endDate) {
      newScheduleStatus = 'active';
      shouldUpdateVehicle = true;
      console.log(`Schedule ${schedule.id} should change from scheduled to active`);
    }
    // Check if active schedule should become completed
    else if (schedule.status === 'active' && today > endDate) {
      newScheduleStatus = 'completed';
      shouldUpdateVehicle = true;
      console.log(`Schedule ${schedule.id} should change from active to completed`);
    }

    // If schedule status needs to change, prepare the update
    if (newScheduleStatus) {
      const scheduleUpdateData = transformVehicleScheduleForDB({
        status: newScheduleStatus
      });

      updates.push({
        type: 'vehicle_schedule',
        id: schedule.id,
        data: scheduleUpdateData
      });

      console.log(`Prepared schedule update for ${schedule.id}:`, scheduleUpdateData);
    }

    // Handle vehicle status updates when schedule status changes
    if (shouldUpdateVehicle) {
      try {
        // Fetch current vehicle status
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('id, status')
          .eq('id', schedule.vehicleId)
          .single();

        if (vehicleError) {
          console.error(`Error fetching vehicle ${schedule.vehicleId}:`, vehicleError);
          continue;
        }

        const currentVehicleStatus = vehicleData.status;
        console.log(`Current vehicle ${schedule.vehicleId} status:`, currentVehicleStatus);

        if (newScheduleStatus === 'active') {
          // Vehicle should become active if it's not in maintenance
          if (currentVehicleStatus !== 'maintenance') {
            const vehicleUpdateData = transformVehicleForDB({
              status: 'active'
            });

            updates.push({
              type: 'vehicle',
              id: schedule.vehicleId,
              data: vehicleUpdateData
            });

            console.log(`Prepared vehicle update to active for ${schedule.vehicleId}`);
          } else {
            console.log(`Vehicle ${schedule.vehicleId} is in maintenance, not changing to active`);
          }
        } else if (newScheduleStatus === 'completed') {
          // Check if there are other active or scheduled schedules for this vehicle
          const { data: otherSchedules, error: schedulesError } = await supabase
            .from('vehicle_schedules')
            .select('id, status')
            .eq('vehicle_id', schedule.vehicleId)
            .neq('id', schedule.id)
            .in('status', ['active', 'scheduled']);

          if (schedulesError) {
            console.error(`Error fetching other schedules for vehicle ${schedule.vehicleId}:`, schedulesError);
            continue;
          }

          const hasOtherActiveSchedules = otherSchedules && otherSchedules.length > 0;
          console.log(`Vehicle ${schedule.vehicleId} has ${otherSchedules?.length || 0} other active/scheduled schedules`);

          // Vehicle should become idle if no other schedules and not in maintenance
          if (!hasOtherActiveSchedules && currentVehicleStatus !== 'maintenance') {
            const vehicleUpdateData = transformVehicleForDB({
              status: 'idle'
            });

            updates.push({
              type: 'vehicle',
              id: schedule.vehicleId,
              data: vehicleUpdateData
            });

            console.log(`Prepared vehicle update to idle for ${schedule.vehicleId}`);
          } else if (hasOtherActiveSchedules) {
            console.log(`Vehicle ${schedule.vehicleId} has other active schedules, keeping current status`);
          } else if (currentVehicleStatus === 'maintenance') {
            console.log(`Vehicle ${schedule.vehicleId} is in maintenance, not changing to idle`);
          }
        }
      } catch (error) {
        console.error(`Error processing vehicle status update for ${schedule.vehicleId}:`, error);
      }
    }
  }

  console.log('Total schedule updates to apply:', updates.length);

  // Execute all updates
  if (updates.length > 0) {
    console.log('Executing schedule and vehicle updates...');
    
    for (const update of updates) {
      try {
        const tableName = update.type === 'vehicle_schedule' ? 'vehicle_schedules' : 'vehicles';
        
        const { error } = await supabase
          .from(tableName)
          .update(update.data)
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating ${update.type} ${update.id}:`, error);
          throw error;
        }

        console.log(`Successfully updated ${update.type} ${update.id}`);
      } catch (error) {
        console.error(`Failed to update ${update.type} ${update.id}:`, error);
        // Continue with other updates even if one fails
      }
    }
  }

  console.log('=== END VEHICLE SCHEDULE STATUS HANDLER DEBUG ===');
  return updates;
}