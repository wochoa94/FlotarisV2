import { supabase } from '../lib/supabase';
import { MaintenanceOrder, Vehicle } from '../types';
import { transformMaintenanceOrderForDB, transformVehicleForDB } from './dataTransform';

interface StatusUpdate {
  type: 'maintenance_order' | 'vehicle';
  id: string;
  data: any;
}

/**
 * Handles automatic status updates for maintenance orders and vehicles based on dates
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

    console.log(`Order ${order.orderNumber}:`, {
      currentStatus: order.status,
      startDate: startDate.toISOString().split('T')[0],
      estimatedCompletion: estimatedCompletionDate.toISOString().split('T')[0],
      startDateReached: startDate <= today,
      completionDatePassed: today > estimatedCompletionDate
    });

    let newOrderStatus: MaintenanceOrder['status'] | null = null;
    let newVehicleStatus: Vehicle['status'] | null = null;

    // Check if scheduled order should become active
    if (order.status === 'scheduled' && startDate <= today) {
      newOrderStatus = 'active';
      newVehicleStatus = 'maintenance';
      console.log(`Order ${order.orderNumber} should change from scheduled to active`);
    }
    // Check if active order should become completed
    else if (order.status === 'active' && today > estimatedCompletionDate) {
      newOrderStatus = 'completed';
      newVehicleStatus = 'idle';
      console.log(`Order ${order.orderNumber} should change from active to completed`);
    }

    // If order status needs to change, prepare the update
    if (newOrderStatus) {
      const orderUpdateData = transformMaintenanceOrderForDB({
        status: newOrderStatus
      });

      updates.push({
        type: 'maintenance_order',
        id: order.id,
        data: orderUpdateData
      });

      console.log(`Prepared order update for ${order.orderNumber}:`, orderUpdateData);
    }

    // If vehicle status needs to change, prepare the update
    if (newVehicleStatus) {
      const vehicle = vehicles.find(v => v.id === order.vehicleId);
      if (vehicle) {
        const vehicleUpdateData = transformVehicleForDB({
          status: newVehicleStatus
        });

        updates.push({
          type: 'vehicle',
          id: vehicle.id,
          data: vehicleUpdateData
        });

        console.log(`Prepared vehicle update for ${vehicle.name}:`, vehicleUpdateData);
      }
    }
  }

  console.log('Total updates to apply:', updates.length);

  // Execute all updates
  if (updates.length > 0) {
    console.log('Executing updates...');
    
    for (const update of updates) {
      try {
        const tableName = update.type === 'maintenance_order' ? 'maintenance_orders' : 'vehicles';
        
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

  console.log('=== END MAINTENANCE STATUS HANDLER DEBUG ===');
  return updates;
}