import { supabase } from '../lib/supabase';
import { transformVehicleForDB } from '../utils/dataTransform';

interface ReconciliationAction {
  type: 'vehicle_update';
  vehicleId: string;
  action: string;
  oldValue: any;
  newValue: any;
  reason: string;
}

interface ReconciliationResult {
  totalInconsistencies: number;
  actionsPerformed: ReconciliationAction[];
  errors: string[];
  duration: number;
}

/**
 * Performs startup reconciliation to fix vehicle-driver assignment inconsistencies
 * This function runs during application bootstrap to ensure data consistency
 * @param vehicles - Raw vehicle data from database
 * @param schedules - Raw schedule data from database
 * @param maintenanceOrders - Raw maintenance order data from database
 * @returns Promise<ReconciliationResult> - Summary of reconciliation actions
 */
export async function performStartupReconciliation(
  vehicles: any[],
  schedules: any[],
  maintenanceOrders: any[]
): Promise<ReconciliationResult> {
  const startTime = Date.now();
  const actions: ReconciliationAction[] = [];
  const errors: string[] = [];

  console.log('🚀 === STARTUP RECONCILIATION INITIATED ===');
  console.log('Timestamp:', new Date().toISOString());

  try {
    console.log(`📋 Data provided: ${vehicles.length} vehicles, ${schedules.length} schedules, ${maintenanceOrders.length} maintenance orders`);

    // Filter active/scheduled schedules and maintenance orders for analysis
    const activeSchedules = schedules.filter(s => s.status === 'active' || s.status === 'scheduled');
    const activeMaintenanceOrders = maintenanceOrders.filter(o => o.status === 'active' || o.status === 'scheduled');

    console.log(`📊 Active items: ${activeSchedules.length} schedules, ${activeMaintenanceOrders.length} maintenance orders`);

    // Identify inconsistencies and prepare fixes
    const inconsistencies = await identifyInconsistencies(vehicles, activeSchedules, activeMaintenanceOrders);
    
    console.log(`🔍 Found ${inconsistencies.length} inconsistencies to fix`);

    // Process each inconsistency
    for (const inconsistency of inconsistencies) {
      try {
        const action = await processInconsistency(inconsistency, activeSchedules, activeMaintenanceOrders);
        if (action) {
          actions.push(action);
        }
      } catch (error) {
        const errorMsg = `Failed to process inconsistency for vehicle ${inconsistency.vehicleId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    const duration = Date.now() - startTime;
    
    console.log('✅ === STARTUP RECONCILIATION COMPLETED ===');
    console.log(`Duration: ${duration}ms`);
    console.log(`Actions performed: ${actions.length}`);
    console.log(`Errors encountered: ${errors.length}`);
    
    if (actions.length > 0) {
      console.log('📝 Actions summary:');
      actions.forEach(action => {
        console.log(`  - Vehicle ${action.vehicleId}: ${action.action} (${action.reason})`);
      });
    }

    if (errors.length > 0) {
      console.log('⚠️ Errors summary:');
      errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    return {
      totalInconsistencies: inconsistencies.length,
      actionsPerformed: actions,
      errors,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = `Startup reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error('💥', errorMsg);
    errors.push(errorMsg);

    return {
      totalInconsistencies: 0,
      actionsPerformed: actions,
      errors,
      duration
    };
  }
}

interface VehicleInconsistency {
  vehicleId: string;
  vehicleName: string;
  currentStatus: string;
  currentDriverId: string | null;
  inconsistencyType: 'active_without_driver' | 'non_active_with_driver' | 'active_stale_assignment';
  details: string;
}

/**
 * Identifies vehicle-driver assignment inconsistencies
 * @param vehicles - Array of vehicles from database
 * @param schedules - Array of active/scheduled schedules from database
 * @param maintenanceOrders - Array of active/scheduled maintenance orders from database
 * @returns Array of inconsistencies found
 */
async function identifyInconsistencies(
  vehicles: any[],
  schedules: any[],
  maintenanceOrders: any[]
): Promise<VehicleInconsistency[]> {
  const inconsistencies: VehicleInconsistency[] = [];

  console.log('🔍 Analyzing vehicles for inconsistencies...');

  for (const vehicle of vehicles) {
    const vehicleName = `${vehicle.name} (${vehicle.marca || 'Unknown'} ${vehicle.model || ''} ${vehicle.year || ''})`.trim();
    
    // Check for active vehicles without assigned drivers
    if (vehicle.status === 'active' && !vehicle.driver_id) {
      inconsistencies.push({
        vehicleId: vehicle.id,
        vehicleName,
        currentStatus: vehicle.status,
        currentDriverId: vehicle.driver_id,
        inconsistencyType: 'active_without_driver',
        details: 'Vehicle is active but has no assigned driver'
      });
      
      console.log(`⚠️ Found inconsistency: ${vehicleName} is active but has no assigned driver`);
    }
    
    // Check for maintenance/idle vehicles with assigned drivers
    if ((vehicle.status === 'maintenance' || vehicle.status === 'idle') && vehicle.driver_id) {
      inconsistencies.push({
        vehicleId: vehicle.id,
        vehicleName,
        currentStatus: vehicle.status,
        currentDriverId: vehicle.driver_id,
        inconsistencyType: 'non_active_with_driver',
        details: `Vehicle is ${vehicle.status} but has assigned driver ${vehicle.driver_id}`
      });
      
      console.log(`⚠️ Found inconsistency: ${vehicleName} is ${vehicle.status} but has assigned driver`);
    }

    // NEW: Check for active vehicles with stale assignments
    if (vehicle.status === 'active' && vehicle.driver_id) {
      const hasActiveSchedule = schedules.some(s => 
        s.vehicle_id === vehicle.id && s.status === 'active'
      );
      
      const hasActiveMaintenanceOrder = maintenanceOrders.some(o => 
        o.vehicle_id === vehicle.id && o.status === 'active'
      );

      // If vehicle is active with a driver but has no active schedule or maintenance order
      if (!hasActiveSchedule && !hasActiveMaintenanceOrder) {
        inconsistencies.push({
          vehicleId: vehicle.id,
          vehicleName,
          currentStatus: vehicle.status,
          currentDriverId: vehicle.driver_id,
          inconsistencyType: 'active_stale_assignment',
          details: `Vehicle is active with driver ${vehicle.driver_id} but has no active schedule or maintenance order`
        });
        
        console.log(`⚠️ Found inconsistency: ${vehicleName} is active with driver but has no active schedule or maintenance`);
      }
    }
  }

  return inconsistencies;
}

/**
 * Processes a single inconsistency and applies the appropriate fix
 * @param inconsistency - The inconsistency to fix
 * @param schedules - Array of active/scheduled schedules for reference
 * @param maintenanceOrders - Array of active/scheduled maintenance orders for reference
 * @returns Promise<ReconciliationAction | null> - Action performed or null if no action needed
 */
async function processInconsistency(
  inconsistency: VehicleInconsistency,
  schedules: any[],
  maintenanceOrders: any[]
): Promise<ReconciliationAction | null> {
  console.log(`🔧 Processing inconsistency for vehicle ${inconsistency.vehicleId}: ${inconsistency.details}`);

  if (inconsistency.inconsistencyType === 'active_without_driver') {
    return await fixActiveVehicleWithoutDriver(inconsistency, schedules);
  } else if (inconsistency.inconsistencyType === 'non_active_with_driver') {
    return await fixNonActiveVehicleWithDriver(inconsistency);
  } else if (inconsistency.inconsistencyType === 'active_stale_assignment') {
    return await fixActiveStaleAssignment(inconsistency);
  }

  return null;
}

/**
 * Fixes active vehicles without assigned drivers
 * @param inconsistency - The inconsistency details
 * @param schedules - Array of active/scheduled schedules
 * @returns Promise<ReconciliationAction | null> - Action performed or null
 */
async function fixActiveVehicleWithoutDriver(
  inconsistency: VehicleInconsistency,
  schedules: any[]
): Promise<ReconciliationAction | null> {
  console.log(`🔍 Looking for active schedule for vehicle ${inconsistency.vehicleId}`);

  // Find active schedule for this vehicle
  const activeSchedule = schedules.find(
    schedule => schedule.vehicle_id === inconsistency.vehicleId && schedule.status === 'active'
  );

  if (activeSchedule) {
    // Assign driver from active schedule
    console.log(`📅 Found active schedule with driver ${activeSchedule.driver_id}`);
    
    const updateData = transformVehicleForDB({
      assignedDriverId: activeSchedule.driver_id
    });

    const { error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', inconsistency.vehicleId);

    if (error) {
      throw new Error(`Failed to assign driver: ${error.message}`);
    }

    console.log(`✅ Assigned driver ${activeSchedule.driver_id} to vehicle ${inconsistency.vehicleId}`);

    return {
      type: 'vehicle_update',
      vehicleId: inconsistency.vehicleId,
      action: 'assign_driver',
      oldValue: null,
      newValue: activeSchedule.driver_id,
      reason: 'Assigned driver from active schedule'
    };
  } else {
    // No active schedule found, change status to idle
    console.log(`💤 No active schedule found, changing status to idle`);
    
    const updateData = transformVehicleForDB({
      status: 'idle'
    });

    const { error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', inconsistency.vehicleId);

    if (error) {
      throw new Error(`Failed to change status to idle: ${error.message}`);
    }

    console.log(`✅ Changed vehicle ${inconsistency.vehicleId} status to idle`);

    return {
      type: 'vehicle_update',
      vehicleId: inconsistency.vehicleId,
      action: 'change_status',
      oldValue: 'active',
      newValue: 'idle',
      reason: 'No active schedule found, changed to idle'
    };
  }
}

/**
 * Fixes maintenance/idle vehicles with assigned drivers
 * @param inconsistency - The inconsistency details
 * @returns Promise<ReconciliationAction | null> - Action performed or null
 */
async function fixNonActiveVehicleWithDriver(
  inconsistency: VehicleInconsistency
): Promise<ReconciliationAction | null> {
  console.log(`🚫 Unassigning driver from ${inconsistency.currentStatus} vehicle ${inconsistency.vehicleId}`);

  const updateData = transformVehicleForDB({
    assignedDriverId: null
  });

  const { error } = await supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', inconsistency.vehicleId);

  if (error) {
    throw new Error(`Failed to unassign driver: ${error.message}`);
  }

  console.log(`✅ Unassigned driver from vehicle ${inconsistency.vehicleId}`);

  return {
    type: 'vehicle_update',
    vehicleId: inconsistency.vehicleId,
    action: 'unassign_driver',
    oldValue: inconsistency.currentDriverId,
    newValue: null,
    reason: `Vehicle is ${inconsistency.currentStatus}, driver should not be assigned`
  };
}

/**
 * Fixes active vehicles with stale driver assignments (no active schedule or maintenance)
 * @param inconsistency - The inconsistency details
 * @returns Promise<ReconciliationAction | null> - Action performed or null
 */
async function fixActiveStaleAssignment(
  inconsistency: VehicleInconsistency
): Promise<ReconciliationAction | null> {
  console.log(`🔄 Fixing stale active assignment for vehicle ${inconsistency.vehicleId}`);

  const updateData = transformVehicleForDB({
    status: 'idle',
    assignedDriverId: null
  });

  const { error } = await supabase
    .from('vehicles')
    .update(updateData)
    .eq('id', inconsistency.vehicleId);

  if (error) {
    throw new Error(`Failed to fix stale assignment: ${error.message}`);
  }

  console.log(`✅ Fixed stale assignment for vehicle ${inconsistency.vehicleId}: active → idle, unassigned driver`);

  return {
    type: 'vehicle_update',
    vehicleId: inconsistency.vehicleId,
    action: 'fix_stale_assignment',
    oldValue: { status: 'active', driverId: inconsistency.currentDriverId },
    newValue: { status: 'idle', driverId: null },
    reason: 'Vehicle was active with driver but had no active schedule or maintenance order'
  };
}