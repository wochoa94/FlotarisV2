import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { FleetData, Driver, Vehicle, MaintenanceOrder, VehicleSchedule } from '../types';
import { 
  fetchFleetData, 
  fetchDriversOnly, 
  fetchVehiclesOnly, 
  fetchMaintenanceOrdersOnly, 
  fetchVehicleSchedulesOnly,
  fetchDashboardSummaryOnly
} from '../services/apiService';

type EntityType = 'drivers' | 'vehicles' | 'maintenanceOrders' | 'vehicleSchedules' | 'summary' | 'all';

interface FleetDataContextType {
  data: FleetData;
  loading: boolean;
  isReconciling: boolean;
  error: string | null;
  refreshData: (entityType?: EntityType) => Promise<void>;
}

const FleetDataContext = createContext<FleetDataContextType | undefined>(undefined);

export function FleetDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FleetData>({ 
    vehicles: [], 
    drivers: [], 
    maintenanceOrders: [], 
    vehicleSchedules: [],
    summary: undefined
  });
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false); // Simplified for API-based approach
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FLEET DATA FETCH START ===');
      console.log('📥 Fetching fleet data from API...');

      // Fetch all fleet data from the API service
      const fleetData = await fetchFleetData();

      console.log('Data fetched successfully:', {
        drivers: fleetData.drivers.length,
        vehicles: fleetData.vehicles.length,
        maintenanceOrders: fleetData.maintenanceOrders.length,
        vehicleSchedules: fleetData.vehicleSchedules.length,
        summary: fleetData.summary ? 'Available' : 'Not available'
      });

      setData(fleetData);
      console.log('=== FLEET DATA FETCH END ===');
    } catch (err) {
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching fleet data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async (entityType: EntityType = 'all') => {
    try {
      setError(null);
      
      console.log(`=== GRANULAR REFRESH START (${entityType.toUpperCase()}) ===`);
      
      if (entityType === 'all') {
        // Full refresh - use existing fetchData logic
        console.log('📥 Performing full fleet data refresh...');
        await fetchData();
        return;
      }
      
      // Granular refresh - fetch only specific entity type
      console.log(`📥 Fetching ${entityType} data only...`);
      
      let updatedData: Partial<FleetData> = {};
      
      switch (entityType) {
        case 'drivers':
          const drivers = await fetchDriversOnly();
          updatedData = { drivers };
          console.log(`✅ Drivers updated: ${drivers.length} records`);
          break;
          
        case 'vehicles':
          const vehicles = await fetchVehiclesOnly();
          updatedData = { vehicles };
          console.log(`✅ Vehicles updated: ${vehicles.length} records`);
          break;
          
        case 'maintenanceOrders':
          const maintenanceOrders = await fetchMaintenanceOrdersOnly();
          updatedData = { maintenanceOrders };
          console.log(`✅ Maintenance orders updated: ${maintenanceOrders.length} records`);
          break;
          
        case 'vehicleSchedules':
          const vehicleSchedules = await fetchVehicleSchedulesOnly();
          updatedData = { vehicleSchedules };
          console.log(`✅ Vehicle schedules updated: ${vehicleSchedules.length} records`);
          break;
          
        case 'summary':
          const summary = await fetchDashboardSummaryOnly();
          updatedData = { summary };
          console.log(`✅ Dashboard summary updated`);
          break;
          
        default:
          console.warn(`Unknown entity type: ${entityType}. Falling back to full refresh.`);
          await fetchData();
          return;
      }
      
      // Merge the updated data with existing data
      setData(prevData => ({
        ...prevData,
        ...updatedData
      }));
      
      console.log(`=== GRANULAR REFRESH END (${entityType.toUpperCase()}) ===`);
      
    } catch (err) {
      console.error(`Error in refreshData for ${entityType}:`, err);
      setError(err instanceof Error ? err.message : `An error occurred while refreshing ${entityType} data`);
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