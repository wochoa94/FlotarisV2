import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { FleetData, Driver, Vehicle, MaintenanceOrder, VehicleSchedule } from '../types';
import { fetchFleetData } from '../services/apiService';

interface FleetDataContextType {
  data: FleetData;
  loading: boolean;
  isReconciling: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
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

  const refreshData = async () => {
    await fetchData();
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