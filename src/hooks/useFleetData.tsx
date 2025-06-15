import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { FleetData, Driver, Vehicle, MaintenanceOrder, VehicleSchedule } from '../types';
import { transformDriver, transformVehicle, transformMaintenanceOrder, transformVehicleSchedule } from '../utils/dataTransform';
import { handleMaintenanceStatusUpdates } from '../utils/maintenanceStatusHandler';

interface FleetDataContextType {
  data: FleetData;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const FleetDataContext = createContext<FleetDataContextType | undefined>(undefined);

export function FleetDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetData>({ vehicles: [], drivers: [], maintenanceOrders: [], vehicleSchedules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FLEET DATA FETCH START ===');

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

      // Transform data from snake_case to camelCase
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

      // Check for automatic status updates
      console.log('Checking for automatic status updates...');
      const statusUpdates = await handleMaintenanceStatusUpdates(
        transformedMaintenanceOrders,
        transformedVehicles
      );

      // If there were status updates, we need to re-fetch the data to get the latest state
      if (statusUpdates.length > 0) {
        console.log(`Applied ${statusUpdates.length} status updates, re-fetching data...`);
        
        // Re-fetch the updated data
        const [updatedVehiclesResponse, updatedMaintenanceOrdersResponse] = await Promise.all([
          supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
          supabase.from('maintenance_orders').select('*').order('created_at', { ascending: false })
        ]);

        if (updatedVehiclesResponse.error) throw updatedVehiclesResponse.error;
        if (updatedMaintenanceOrdersResponse.error) throw updatedMaintenanceOrdersResponse.error;

        // Transform the updated data
        const updatedTransformedVehicles: Vehicle[] = updatedVehiclesResponse.data.map(transformVehicle);
        const updatedTransformedMaintenanceOrders: MaintenanceOrder[] = updatedMaintenanceOrdersResponse.data.map(transformMaintenanceOrder);

        console.log('Updated data after status changes:', {
          vehicles: updatedTransformedVehicles.length,
          maintenanceOrders: updatedTransformedMaintenanceOrders.length
        });

        setData({
          drivers: transformedDrivers,
          vehicles: updatedTransformedVehicles,
          maintenanceOrders: updatedTransformedMaintenanceOrders,
          vehicleSchedules: transformedVehicleSchedules,
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

      console.log('=== FLEET DATA FETCH END ===');
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value = {
    data,
    loading,
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