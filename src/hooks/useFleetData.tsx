import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { FleetData, Driver, Vehicle, MaintenanceOrder, VehicleSchedule } from '../types';
import { transformDriver, transformVehicle, transformMaintenanceOrder, transformVehicleSchedule } from '../utils/dataTransform';
import { handleMaintenanceStatusUpdates } from '../utils/maintenanceStatusHandler';
import { handleVehicleScheduleStatusUpdates } from '../utils/vehicleScheduleStatusHandler';
import { performStartupReconciliation } from '../services/reconciliationService';

interface FleetDataContextType {
  data: FleetData;
  loading: boolean;
  isReconciling: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const FleetDataContext = createContext<FleetDataContextType | undefined>(undefined);

export function FleetDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetData>({ vehicles: [], drivers: [], maintenanceOrders: [], vehicleSchedules: [] });
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FLEET DATA FETCH START ===');

      // STEP 1: Perform startup reconciliation first
      if (isReconciling) {
        console.log('🔄 Performing startup reconciliation...');
        const reconciliationResult = await performStartupReconciliation();
        
        console.log('📊 Reconciliation completed:', {
          inconsistencies: reconciliationResult.totalInconsistencies,
          actions: reconciliationResult.actionsPerformed.length,
          errors: reconciliationResult.errors.length,
          duration: `${reconciliationResult.duration}ms`
        });

        setIsReconciling(false);
        console.log('✅ Reconciliation phase completed');
      }

      // STEP 2: Fetch all fleet data
      console.log('📥 Fetching fleet data...');

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (driversError) throw driversError;

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehiclesError) throw vehiclesError;

      // Fetch maintenance orders
      const { data: maintenanceOrdersData, error: maintenanceOrdersError } = await supabase
        .from('maintenance_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (maintenanceOrdersError) throw maintenanceOrdersError;

      // Fetch vehicle schedules
      const { data: vehicleSchedulesData, error: vehicleSchedulesError } = await supabase
        .from('vehicle_schedules')
        .select('*')
        .order('start_date', { ascending: false });

      if (vehicleSchedulesError) throw vehicleSchedulesError;

      // STEP 3: Transform data from snake_case to camelCase
      const transformedDrivers: Driver[] = driversData.map(transformDriver);
      const transformedVehicles: Vehicle[] = vehiclesData.map(transformVehicle);
      const transformedMaintenanceOrders: MaintenanceOrder[] = maintenanceOrdersData.map(transformMaintenanceOrder);
      const transformedVehicleSchedules: VehicleSchedule[] = vehicleSchedulesData.map(transformVehicleSchedule);

      console.log('Data fetched and transformed:', {
        drivers: transformedDrivers.length,
        vehicles: transformedVehicles.length,
        maintenanceOrders: transformedMaintenanceOrders.length,
        vehicleSchedules: transformedVehicleSchedules.length
      });

      // STEP 4: Check for automatic status updates (only after reconciliation)
      if (!isReconciling) {
        console.log('🔄 Checking for automatic status updates...');
        
        // Handle maintenance order status updates
        const maintenanceStatusUpdates = await handleMaintenanceStatusUpdates(
          transformedMaintenanceOrders,
          transformedVehicles
        );

        // Handle vehicle schedule status updates
        const scheduleStatusUpdates = await handleVehicleScheduleStatusUpdates(
          transformedVehicleSchedules
        );

        const totalUpdates = maintenanceStatusUpdates.length + scheduleStatusUpdates.length;

        // If there were status updates, re-fetch the data to get the latest state
        if (totalUpdates > 0) {
          console.log(`Applied ${totalUpdates} status updates, re-fetching data...`);
          
          // Re-fetch the updated data
          const [updatedVehiclesResponse, updatedMaintenanceOrdersResponse, updatedVehicleSchedulesResponse] = await Promise.all([
            supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
            supabase.from('maintenance_orders').select('*').order('created_at', { ascending: false }),
            supabase.from('vehicle_schedules').select('*').order('start_date', { ascending: false })
          ]);

          if (updatedVehiclesResponse.error) throw updatedVehiclesResponse.error;
          if (updatedMaintenanceOrdersResponse.error) throw updatedMaintenanceOrdersResponse.error;
          if (updatedVehicleSchedulesResponse.error) throw updatedVehicleSchedulesResponse.error;

          // Transform the updated data
          const updatedTransformedVehicles: Vehicle[] = updatedVehiclesResponse.data.map(transformVehicle);
          const updatedTransformedMaintenanceOrders: MaintenanceOrder[] = updatedMaintenanceOrdersResponse.data.map(transformMaintenanceOrder);
          const updatedTransformedVehicleSchedules: VehicleSchedule[] = updatedVehicleSchedulesResponse.data.map(transformVehicleSchedule);

          console.log('Updated data after status changes:', {
            vehicles: updatedTransformedVehicles.length,
            maintenanceOrders: updatedTransformedMaintenanceOrders.length,
            vehicleSchedules: updatedTransformedVehicleSchedules.length
          });

          setData({
            drivers: transformedDrivers,
            vehicles: updatedTransformedVehicles,
            maintenanceOrders: updatedTransformedMaintenanceOrders,
            vehicleSchedules: updatedTransformedVehicleSchedules,
          });
        } else {
          console.log('No status updates needed, using original data');
          setData({
            drivers: transformedDrivers,
            vehicles: transformedVehicles,
            maintenanceOrders: transformedMaintenanceOrders,
            vehicleSchedules: transformedVehicleSchedules,
          });
        }
      } else {
        // During reconciliation, just set the data without status updates
        setData({
          drivers: transformedDrivers,
          vehicles: transformedVehicles,
          maintenanceOrders: transformedMaintenanceOrders,
          vehicleSchedules: transformedVehicleSchedules,
        });
      }

      console.log('=== FLEET DATA FETCH END ===');
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      // If reconciliation fails, still allow the app to continue
      if (isReconciling) {
        setIsReconciling(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    // Don't run reconciliation on manual refresh
    const wasReconciling = isReconciling;
    if (isReconciling) {
      setIsReconciling(false);
    }
    
    await fetchData();
    
    // Restore reconciliation state if it was changed
    if (wasReconciling) {
      setIsReconciling(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value = {
    data,
    loading,
    isReconciling,
    error,
    refreshData,
  };

  return <FleetDataContext.Provider value={value}>{children}</FleetDataContext.Provider>;
}

export function useFleetData() {
  const context = useContext(FleetDataContext);
  if (context === undefined) {
    throw new Error('useFleetData must be used within a FleetDataProvider');
  }
  return context;
}