import { supabase } from '../lib/supabase';
import { MaintenanceOrder, Vehicle } from '../types';
import { transformMaintenanceOrderForDB, transformVehicleForDB } from './dataTransform';

interface StatusUpdate {
  type: 'maintenance_order' | 'vehicle';
  id: string;
  data: any;
  reason: string;
}

/**
 * Handles automatic status updates for maintenance orders and vehicles based on dates
 * Manages driver assignments and vehicle status transitions according to business rules
 * @param maintenanceOrders - Array of maintenance orders
 * @param vehicles - Array of vehicles
 * @returns Promise<StatusUpdate[]> - Array of updates that were applied
 */
export async function handleMaintenanceStatusUpdates(
  maintenanceOrders: MaintenanceOrder[],
  vehicles: Vehicle[]
): Promise<StatusUpdate[]> {
  const updates: StatusUpdate[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

  console.log('=== MAINTENANCE STATUS HANDLER DEBUG ===');
  console.log('Processing', maintenanceOrders.length, 'maintenance orders');
  console.log('Today:', today.toISOString().split('T')[0]);

  // Process each maintenance order for potential status updates
  for (const order of maintenanceOrders) {
    const startDate = new Date(order.startDate);
    const estimatedCompletionDate = new Date(order.estimatedCompletionDate);
    startDate.setHours(0, 0, 0, 0);
    estimatedCompletionDate.setHours(0, 0, 0, 0);

    console.log(`\n--- Processing Maintenance Order ${order.orderNumber} ---`);
    console.log(`Order Details:`, {
      currentStatus: order.status,
      vehicleId: order.vehicleId,
      startDate: startDate.toISOString().split('T')[0],
      estimatedCompletion: estimatedCompletionDate.toISOString().split('T')[0],
      startDateReached: startDate <= today,
      completionDatePassed: today > estimatedCompletionDate
    });

    let newOrderStatus: MaintenanceOrder['status'] | null = null;

    // Determine if maintenance order status needs to change
    if (order.status === 'scheduled' && startDate <= today) {
      newOrderStatus = 'active';
      console.log(`✓ Maintenance order should transition: scheduled → active`);
    } else if (order.status === 'active' && today > estimatedCompletionDate) {
      newOrderStatus = 'completed';
      console.log(`✓ Maintenance order should transition: active → completed`);
    }

    // If order status needs to change, prepare the update
    if (newOrderStatus) {
      const orderUpdateData = transformMaintenanceOrderForDB({
        status: newOrderStatus
      });

      updates.push({
        type: 'maintenance_order',
        id: order.id,
        data: orderUpdateData,
        reason: `Maintenance order status transition: ${order.status} → ${newOrderStatus}`
      });

      console.log(`📝 Prepared maintenance order update:`, orderUpdateData);

      // Handle vehicle status and driver assignment updates
      await handleVehicleStatusAndDriverAssignmentForMaintenance(
        order,
        newOrderStatus,
        vehicles,
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
        const tableName = update.type === 'maintenance_order' ? 'maintenance_orders' : 'vehicles';
        
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

  console.log('=== END MAINTENANCE STATUS HANDLER DEBUG ===\n');
  return updates;
}

/**
 * Handles vehicle status and driver assignment changes when a maintenance order status changes
 * @param order - The maintenance order being updated
 * @param newOrderStatus - The new status for the maintenance order
 * @param vehicles - Array of vehicles for reference
 * @param updates - Array to add vehicle updates to
 */
async function handleVehicleStatusAndDriverAssignmentForMaintenance(
  order: MaintenanceOrder,
  newOrderStatus: MaintenanceOrder['status'],
  vehicles: Vehicle[],
  updates: StatusUpdate[]
): Promise<void> {
  try {
    console.log(`\n🔄 Processing vehicle status and driver assignment for vehicle ${order.vehicleId}`);

    // Find the vehicle in the provided array
    const vehicle = vehicles.find(v => v.id === order.vehicleId);
    if (!vehicle) {
      console.error(`❌ Vehicle ${order.vehicleId} not found in vehicles array`);
      return;
    }

    console.log(`Current vehicle state:`, {
      status: vehicle.status,
      assignedDriverId: vehicle.assignedDriverId
    });

    if (newOrderStatus === 'active') {
      await handleMaintenanceActivation(
        order,
        vehicle,
        updates
      );
    } else if (newOrderStatus === 'completed') {
      await handleMaintenanceCompletion(
        order,
        vehicle,
        updates
      );
    }
  } catch (error) {
    console.error(`💥 Error processing vehicle status update for maintenance order ${order.id}:`, error);
  }
}

/**
 * Handles vehicle updates when a maintenance order becomes active
 * @param order - The maintenance order becoming active
 * @param vehicle - The vehicle being maintained
 * @param updates - Array to add vehicle updates to
 */
async function handleMaintenanceActivation(
  order: MaintenanceOrder,
  vehicle: Vehicle,
  updates: StatusUpdate[]
): Promise<void> {
  console.log(`\n🔧 Handling maintenance activation for vehicle ${order.vehicleId}`);

  const vehicleUpdateData: any = {};
  const reasons: string[] = [];

  // Always set vehicle status to maintenance when maintenance becomes active
  if (vehicle.status !== 'maintenance') {
    vehicleUpdateData.status = 'maintenance';
    reasons.push(`Status transition: ${vehicle.status} → maintenance`);
    console.log(`🚗 Setting vehicle status to maintenance`);
  }

  // Always unassign driver when maintenance becomes active
  if (vehicle.assignedDriverId !== null) {
    vehicleUpdateData.driver_id = null;
    reasons.push(`Driver unassignment: ${vehicle.assignedDriverId} → none (maintenance started)`);
    console.log(`👤 Unassigning driver due to maintenance`);
  }

  // Add update if there are changes to make
  if (Object.keys(vehicleUpdateData).length > 0) {
    const dbUpdateData = transformVehicleForDB(vehicleUpdateData);
    
    updates.push({
      type: 'vehicle',
      id: order.vehicleId,
      data: dbUpdateData,
      reason: `Maintenance activation: ${reasons.join(', ')}`
    });

    console.log(`📝 Prepared vehicle update:`, dbUpdateData);
  } else {
    console.log(`ℹ️ No vehicle updates needed for maintenance activation`);
  }
}

/**
 * Handles vehicle updates when a maintenance order is completed
 * @param order - The maintenance order being completed
 * @param vehicle - The vehicle that was being maintained
 * @param updates - Array to add vehicle updates to
 */
async function handleMaintenanceCompletion(
  order: MaintenanceOrder,
  vehicle: Vehicle,
  updates: StatusUpdate[]
): Promise<void> {
  console.log(`\n✅ Handling maintenance completion for vehicle ${order.vehicleId}`);

  const vehicleUpdateData: any = {};
  const reasons: string[] = [];

  // Always ensure driver is unassigned when maintenance completes
  if (vehicle.assignedDriverId !== null) {
    vehicleUpdateData.driver_id = null;
    reasons.push(`Driver unassignment: ${vehicle.assignedDriverId} → none (maintenance completed)`);
    console.log(`👤 Ensuring driver is unassigned after maintenance`);
  }

  // Determine new vehicle status and driver assignment based on active schedules
  const statusAndDriver = await determineVehicleStatusAfterMaintenanceCompletion(order.vehicleId);
  
  if (statusAndDriver.status && statusAndDriver.status !== vehicle.status) {
    vehicleUpdateData.status = statusAndDriver.status;
    reasons.push(`Status transition: ${vehicle.status} → ${statusAndDriver.status}`);
    console.log(`🚗 Setting vehicle status to ${statusAndDriver.status}`);
  }

  // Assign driver if there's an active schedule
  if (statusAndDriver.driverId) {
    vehicleUpdateData.driver_id = statusAndDriver.driverId;
    // Update the driver assignment reason
    const driverReasonIndex = reasons.findIndex(r => r.includes('Driver unassignment'));
    if (driverReasonIndex >= 0) {
      reasons[driverReasonIndex] = `Driver reassignment: ${vehicle.assignedDriverId || 'none'} → ${statusAndDriver.driverId} (from active schedule)`;
    } else {
      reasons.push(`Driver assignment: → ${statusAndDriver.driverId} (from active schedule)`);
    }
    console.log(`👤 Assigning driver ${statusAndDriver.driverId} from active schedule`);
  }

  // Add update
  const dbUpdateData = transformVehicleForDB(vehicleUpdateData);
  
  updates.push({
    type: 'vehicle',
    id: order.vehicleId,
    data: dbUpdateData,
    reason: `Maintenance completion: ${reasons.join(', ')}`
  });

  console.log(`📝 Prepared vehicle update:`, dbUpdateData);
}

/**
 * Determines the appropriate vehicle status and driver assignment after maintenance completion
 * Priority: active (if active schedule exists) > idle
 * @param vehicleId - ID of the vehicle
 * @returns Promise<{status: string | null, driverId: string | null}> - New vehicle status and driver assignment
 */
async function determineVehicleStatusAfterMaintenanceCompletion(
  vehicleId: string
): Promise<{status: string | null, driverId: string | null}> {
  console.log(`🔍 Determining new vehicle status after maintenance completion for ${vehicleId}`);

  // Check for active vehicle schedules
  const { data: activeSchedules, error: schedulesError } = await supabase
    .from('vehicle_schedules')
    .select('id, status, driver_id')
    .eq('vehicle_id', vehicleId)
    .eq('status', 'active');

  if (schedulesError) {
    console.error(`❌ Error fetching active schedules:`, schedulesError);
    return { status: 'idle', driverId: null }; // Default to idle on error
  }

  if (activeSchedules && activeSchedules.length > 0) {
    const activeSchedule = activeSchedules[0]; // Take the first active schedule
    console.log(`📅 Found active schedule → active with driver ${activeSchedule.driver_id}`);
    return { 
      status: 'active', 
      driverId: activeSchedule.driver_id 
    };
  }

  // No active schedules
  console.log(`💤 No active schedules → idle`);
  return { status: 'idle', driverId: null };
}