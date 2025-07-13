import { useState, useEffect, useCallback } from 'react';
import { GanttItem, GanttVehicle, Vehicle, Driver, MaintenanceOrder, VehicleSchedule } from '../types';
import { vehicleScheduleService, maintenanceOrderService, fetchFleetData } from '../services/apiService';
import { format, addDays } from 'date-fns';

interface UseGanttChartDataReturn {
  ganttVehicles: GanttVehicle[];
  ganttItems: GanttItem[];
  stats: {
    totalItems: number;
    activeSchedules: number;
    activeMaintenance: number;
    urgentItems: number;
  };
  loading: boolean;
  error: string | null;
  refreshGanttData: () => Promise<void>;
}

export function useGanttChartData(
  currentStartDate: Date,
  daysToShow: number
): UseGanttChartDataReturn {
  const [ganttVehicles, setGanttVehicles] = useState<GanttVehicle[]>([]);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    activeSchedules: 0,
    activeMaintenance: 0,
    urgentItems: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGanttData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const currentEndDate = addDays(currentStartDate, daysToShow - 1);
      const startDateStr = format(currentStartDate, 'yyyy-MM-dd');
      const endDateStr = format(currentEndDate, 'yyyy-MM-dd');

      console.log('=== GANTT DATA FETCH START ===');
      console.log('📅 Date range:', startDateStr, 'to', endDateStr);

      // Fetch data in parallel
      const [
        fleetDataResponse,
        vehicleSchedulesResponse,
        maintenanceOrdersResponse
      ] = await Promise.all([
        // Fetch all vehicles and drivers (needed for display regardless of date range)
        fetchFleetData(),
        // Fetch vehicle schedules with date range filter
        vehicleScheduleService.fetchPaginatedVehicleSchedules({
          startDate: startDateStr,
          endDate: endDateStr,
          limit: 1000, // Large limit to get all schedules in range
        }),
        // Fetch maintenance orders with date range filter
        maintenanceOrderService.fetchPaginatedMaintenanceOrders({
          startDate: startDateStr,
          endDate: endDateStr,
          limit: 1000, // Large limit to get all orders in range
        })
      ]);

      const { vehicles, drivers } = fleetDataResponse;
      const { vehicleSchedules } = vehicleSchedulesResponse;
      const { maintenanceOrders } = maintenanceOrdersResponse;

      console.log('📊 Data fetched:', {
        vehicles: vehicles.length,
        drivers: drivers.length,
        vehicleSchedules: vehicleSchedules.length,
        maintenanceOrders: maintenanceOrders.length
      });

      // Transform vehicles for Gantt chart
      const transformedVehicles: GanttVehicle[] = vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status
      }));

      // Transform vehicle schedules into Gantt items
      const scheduleItems: GanttItem[] = vehicleSchedules.map(schedule => {
        // Find driver from the nested data or fallback to drivers array
        const driver = (schedule as any).driver || drivers.find(d => d.id === schedule.driverId);
        
        // Enhanced color coding for vehicle schedules
        let scheduleColor: string;
        if (schedule.status === 'completed') {
          scheduleColor = '#808080'; // Grey for completed
        } else if (schedule.status === 'active') {
          scheduleColor = '#1976D2'; // Blue for active
        } else if (schedule.status === 'scheduled') {
          scheduleColor = '#64B5F6'; // Light blue for scheduled
        } else {
          scheduleColor = '#1976D2'; // Default to blue for any other status
        }
        
        return {
          id: schedule.id,
          vehicleId: schedule.vehicleId,
          type: 'schedule' as const,
          title: driver ? driver.name : 'Unknown Driver',
          startDate: schedule.startDate,
          endDate: schedule.endDate,
          color: scheduleColor,
          details: {
            driverName: driver?.name,
            status: schedule.status,
            notes: schedule.notes || undefined
          }
        };
      });

      // Transform maintenance orders into Gantt items
      const maintenanceItems: GanttItem[] = maintenanceOrders.map(order => {
        // Enhanced color coding for maintenance orders
        let maintenanceColor: string;
        if (order.status === 'completed') {
          maintenanceColor = '#808080'; // Grey for completed
        } else if (order.status === 'pending_authorization') {
          maintenanceColor = '#FFF59D'; // Less pale yellow for pending authorization
        } else if (order.status === 'active') {
          maintenanceColor = '#FF9800'; // Orange-ish amber for active
        } else if (order.status === 'scheduled') {
          maintenanceColor = '#FFC107'; // Amber for scheduled
        } else {
          maintenanceColor = '#FFC107'; // Default to amber for any other status
        }
        
        return {
          id: order.id,
          vehicleId: order.vehicleId,
          type: 'maintenance' as const,
          title: order.orderNumber,
          startDate: order.startDate,
          endDate: order.estimatedCompletionDate,
          color: maintenanceColor,
          details: {
            orderNumber: order.orderNumber,
            description: order.description || undefined,
            status: order.status,
            urgent: order.urgent || false,
            location: order.location || undefined
          }
        };
      });

      // Combine all items
      const allItems = [...scheduleItems, ...maintenanceItems];

      // Calculate statistics (only count non-completed items for active stats)
      const calculatedStats = {
        totalItems: allItems.length,
        activeSchedules: scheduleItems.filter(item => item.details.status === 'active').length,
        activeMaintenance: maintenanceItems.filter(item => item.details.status === 'active').length,
        urgentItems: allItems.filter(item => item.details.urgent).length
      };

      setGanttVehicles(transformedVehicles);
      setGanttItems(allItems);
      setStats(calculatedStats);

      console.log('✅ Gantt data transformation complete:', {
        ganttVehicles: transformedVehicles.length,
        ganttItems: allItems.length,
        stats: calculatedStats
      });
      console.log('=== GANTT DATA FETCH END ===');

    } catch (err) {
      console.error('Error fetching Gantt chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Gantt chart data');
      setGanttVehicles([]);
      setGanttItems([]);
      setStats({
        totalItems: 0,
        activeSchedules: 0,
        activeMaintenance: 0,
        urgentItems: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [currentStartDate, daysToShow]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchGanttData();
  }, [fetchGanttData]);

  const refreshGanttData = useCallback(async () => {
    await fetchGanttData();
  }, [fetchGanttData]);

  return {
    ganttVehicles,
    ganttItems,
    stats,
    loading,
    error,
    refreshGanttData,
  };
}