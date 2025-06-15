import { supabase } from '../lib/supabase';
import { VehicleSchedule } from '../types';
import { transformVehicleScheduleForDB, transformVehicleForDB } from './dataTransform';

interface StatusUpdate {
  type: 'vehicle_schedule' | 'vehicle';
  id: string;
  data: any;
  reason: string;
}

/**
 * Handles automatic status updates for vehicle schedules and their associated vehicles based on dates
 * Manages driver assignments and vehicle status transitions according to business rules
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

    console.log(`\n--- Processing Schedule ${schedule.id} ---`);
    console.log(`Schedule Details:`, {
      currentStatus: schedule.status,
      vehicleId: schedule.vehicleId,
      driverId: schedule.driverId,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      startDateReached: startDate <= today,
      endDatePassed: today > endDate,
      isCurrentlyActive: startDate <= today && today <= endDate
    });

    let newScheduleStatus: VehicleSchedule['status'] | null = null;

    // Determine if schedule status needs to change
    if (schedule.status === 'scheduled' && startDate <= today && today <= endDate) {
      newScheduleStatus = 'active';
      console.log(`✓ Schedule should transition: scheduled → active`);
    } else if (schedule.status === 'active' && today > endDate) {
      newScheduleStatus = 'completed';
      console.log(`✓ Schedule should transition: active → completed`);
    }

    // If schedule status needs to change, prepare the update
    if (newScheduleStatus) {
      const scheduleUpdateData = transformVehicleScheduleForDB({
        status: newScheduleStatus
      });

      updates.push({
        type: 'vehicle_schedule',
        id: schedule.id,
        data: scheduleUpdateData,
        reason: `Schedule status transition: ${schedule.status} → ${newScheduleStatus}`
      });

      console.log(`📝 Prepared schedule update:`, scheduleUpdateData);

      // Handle vehicle status and driver assignment updates
      await handleVehicleStatusAndDriverAssignment(
        schedule,
        newScheduleStatus,
        updates
      );
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log('Total updates to apply:', updates.length);
  updates.forEach(update => {
    console.log(`- ${update.type} ${update.id}: ${update.reason}`);
  });

  // Execute all updates
  if (updates.length > 0) {
    console.log('\n🚀 Executing updates...');
    
    for (const update of updates) {
      try {
        const tableName = update.type === 'vehicle_schedule' ? 'vehicle_schedules' : 'vehicles';
        
        const { error } = await supabase
          .from(tableName)
          .update(update.data)
          .eq('id', update.id);

        if (error) {
          console.error(`❌ Error updating ${update.type} ${update.id}:`, error);
          throw error;
        }

        console.log(`✅ Successfully updated ${update.type} ${update.id}: ${update.reason}`);
      } catch (error) {
        console.error(`💥 Failed to update ${update.type} ${update.id}:`, error);
        // Continue with other updates even if one fails
      }
    }
  }

  console.log('=== END VEHICLE SCHEDULE STATUS HANDLER DEBUG ===\n');
  return updates;
}

/**
 * Handles vehicle status and driver assignment changes when a schedule status changes
 * @param schedule - The schedule being updated
 * @param newScheduleStatus - The new status for the schedule
 * @param updates - Array to add vehicle updates to
 */
async function handleVehicleStatusAndDriverAssignment(
  schedule: VehicleSchedule,
  newScheduleStatus: VehicleSchedule['status'],
  updates: StatusUpdate[]
): Promise<void> {
  try {
    console.log(`\n🔄 Processing vehicle status and driver assignment for vehicle ${schedule.vehicleId}`);

    // Fetch current vehicle data
    const { data: vehicleData, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, status, driver_id')
      .eq('id', schedule.vehicleId)
      .single();

    if (vehicleError) {
      console.error(`❌ Error fetching vehicle ${schedule.vehicleId}:`, vehicleError);
      return;
    }

    const currentVehicleStatus = vehicleData.status;
    const currentAssignedDriverId = vehicleData.driver_id;

    console.log(`Current vehicle state:`, {
      status: currentVehicleStatus,
      assignedDriverId: currentAssignedDriverId
    });

    if (newScheduleStatus === 'active') {
      await handleScheduleActivation(
        schedule,
        currentVehicleStatus,
        currentAssignedDriverId,
        updates
      );
    } else if (newScheduleStatus === 'completed') {
      await handleScheduleCompletion(
        schedule,
        currentVehicleStatus,
        updates
      );
    }
  } catch (error) {
    console.error(`💥 Error processing vehicle status update for ${schedule.vehicleId}:`, error);
  }
}

/**
 * Handles vehicle updates when a schedule becomes active
 * @param schedule - The schedule becoming active
 * @param currentVehicleStatus - Current vehicle status
 * @param currentAssignedDriverId - Currently assigned driver ID
 * @param updates - Array to add vehicle updates to
 */
async function handleScheduleActivation(
  schedule: VehicleSchedule,
  currentVehicleStatus: string,
  currentAssignedDriverId: string | null,
  updates: StatusUpdate[]
): Promise<void> {
  console.log(`\n🟢 Handling schedule activation for vehicle ${schedule.vehicleId}`);

  const vehicleUpdateData: any = {};
  const reasons: string[] = [];

  // Always assign the driver from the active schedule
  if (currentAssignedDriverId !== schedule.driverId) {
    vehicleUpdateData.driver_id = schedule.driverId;
    reasons.push(`Driver assignment: ${currentAssignedDriverId || 'none'} → ${schedule.driverId}`);
    console.log(`👤 Assigning driver ${schedule.driverId} to vehicle`);
  }

  // Update vehicle status to active if not in maintenance
  if (currentVehicleStatus !== 'maintenance') {
    if (currentVehicleStatus !== 'active') {
      vehicleUpdateData.status = 'active';
      reasons.push(`Status transition: ${currentVehicleStatus} → active`);
      console.log(`🚗 Setting vehicle status to active`);
    }
  } else {
    console.log(`⚠️ Vehicle is in maintenance, not changing status to active`);
    // Still assign driver even if vehicle is in maintenance
  }

  // Add update if there are changes to make
  if (Object.keys(vehicleUpdateData).length > 0) {
    const dbUpdateData = transformVehicleForDB(vehicleUpdateData);
    
    updates.push({
      type: 'vehicle',
      id: schedule.vehicleId,
      data: dbUpdateData,
      reason: `Schedule activation: ${reasons.join(', ')}`
    });

    console.log(`📝 Prepared vehicle update:`, dbUpdateData);
  } else {
    console.log(`ℹ️ No vehicle updates needed for activation`);
  }
}

/**
 * Handles vehicle updates when a schedule is completed
 * @param schedule - The schedule being completed
 * @param currentVehicleStatus - Current vehicle status
 * @param updates - Array to add vehicle updates to
 */
async function handleScheduleCompletion(
  schedule: VehicleSchedule,
  currentVehicleStatus: string,
  updates: StatusUpdate[]
): Promise<void> {
  console.log(`\n🔴 Handling schedule completion for vehicle ${schedule.vehicleId}`);

  const vehicleUpdateData: any = {};
  const reasons: string[] = [];

  // Always unassign driver when schedule completes
  vehicleUpdateData.driver_id = null;
  reasons.push('Driver unassignment (schedule completed)');
  console.log(`👤 Unassigning driver from vehicle`);

  // Determine new vehicle status based on priority rules
  const newVehicleStatus = await determineVehicleStatusAfterScheduleCompletion(schedule.vehicleId, schedule.id);
  
  if (newVehicleStatus && newVehicleStatus !== currentVehicleStatus) {
    vehicleUpdateData.status = newVehicleStatus;
    reasons.push(`Status transition: ${currentVehicleStatus} → ${newVehicleStatus}`);
    console.log(`🚗 Setting vehicle status to ${newVehicleStatus}`);

    // If transitioning to active due to another schedule, assign that schedule's driver
    if (newVehicleStatus === 'active') {
      const activeScheduleDriverId = await getActiveScheduleDriverId(schedule.vehicleId, schedule.id);
      if (activeScheduleDriverId) {
        vehicleUpdateData.driver_id = activeScheduleDriverId;
        reasons[0] = `Driver reassignment: → ${activeScheduleDriverId} (from active schedule)`;
        console.log(`👤 Reassigning driver ${activeScheduleDriverId} from active schedule`);
      }
    }
  }

  // Add update
  const dbUpdateData = transformVehicleForDB(vehicleUpdateData);
  
  updates.push({
    type: 'vehicle',
    id: schedule.vehicleId,
    data: dbUpdateData,
    reason: `Schedule completion: ${reasons.join(', ')}`
  });

  console.log(`📝 Prepared vehicle update:`, dbUpdateData);
}

/**
 * Determines the appropriate vehicle status after a schedule completion
 * Priority: maintenance > active (other schedules) > idle
 * @param vehicleId - ID of the vehicle
 * @param excludeScheduleId - ID of the schedule being completed (to exclude from checks)
 * @returns Promise<string | null> - New vehicle status or null if no change needed
 */
async function determineVehicleStatusAfterScheduleCompletion(
  vehicleId: string,
  excludeScheduleId: string
): Promise<string | null> {
  console.log(`🔍 Determining new vehicle status for ${vehicleId}`);

  // Check for active or scheduled maintenance orders (highest priority)
  const { data: maintenanceOrders, error: maintenanceError } = await supabase
    .from('maintenance_orders')
    .select('id, status')
    .eq('vehicle_id', vehicleId)
    .in('status', ['active', 'scheduled']);

  if (maintenanceError) {
    console.error(`❌ Error fetching maintenance orders:`, maintenanceError);
    return 'idle'; // Default to idle on error
  }

  if (maintenanceOrders && maintenanceOrders.length > 0) {
    console.log(`🔧 Found ${maintenanceOrders.length} active/scheduled maintenance orders → maintenance`);
    return 'maintenance';
  }

  // Check for other active or scheduled vehicle schedules
  const { data: otherSchedules, error: schedulesError } = await supabase
    .from('vehicle_schedules')
    .select('id, status, driver_id')
    .eq('vehicle_id', vehicleId)
    .neq('id', excludeScheduleId)
    .in('status', ['active', 'scheduled']);

  if (schedulesError) {
    console.error(`❌ Error fetching other schedules:`, schedulesError);
    return 'idle'; // Default to idle on error
  }

  if (otherSchedules && otherSchedules.length > 0) {
    const activeSchedules = otherSchedules.filter(s => s.status === 'active');
    if (activeSchedules.length > 0) {
      console.log(`📅 Found ${activeSchedules.length} other active schedules → active`);
      return 'active';
    } else {
      console.log(`📅 Found ${otherSchedules.length} other scheduled schedules → idle (will become active when scheduled)`);
      return 'idle';
    }
  }

  // No other schedules or maintenance
  console.log(`💤 No other schedules or maintenance → idle`);
  return 'idle';
}

/**
 * Gets the driver ID from an active schedule for the vehicle
 * @param vehicleId - ID of the vehicle
 * @param excludeScheduleId - ID of the schedule being completed (to exclude from checks)
 * @returns Promise<string | null> - Driver ID from active schedule or null
 */
async function getActiveScheduleDriverId(
  vehicleId: string,
  excludeScheduleId: string
): Promise<string | null> {
  const { data: activeSchedules, error } = await supabase
    .from('vehicle_schedules')
    .select('driver_id')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'active')
    .neq('id', excludeScheduleId)
    .limit(1);

  if (error) {
    console.error(`❌ Error fetching active schedule driver:`, error);
    return null;
  }

  return activeSchedules && activeSchedules.length > 0 ? activeSchedules[0].driver_id : null;
}