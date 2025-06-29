import {
  transformDriver,
  transformVehicle,
  transformMaintenanceOrder,
  transformVehicleSchedule,
} from '../utils/dataTransform';
import { FleetData } from '../types';

// IMPORTANT: Replace this with the actual URL of your running backend service.
// For local development, it might be something like 'http://localhost:3000'
// or the port your Node.js backend is listening on.
const BASE_URL = 'http://localhost:3000/api'; // Assuming a common /api prefix

export async function fetchFleetData(): Promise<FleetData> {
  try {
    // This endpoint should be implemented in your backend to return all fleet data
    // (vehicles, drivers, maintenance orders, vehicle schedules)
    const response = await fetch(`${BASE_URL}/fleet`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch fleet data');
    }

    const rawData = await response.json();

    // Assuming your backend returns an object with keys matching your table names
    // (e.g., { vehicles: [...], drivers: [...], maintenance_orders: [...], vehicle_schedules: [...] })
    const transformedData: FleetData = {
      vehicles: rawData.vehicles.map(transformVehicle),
      drivers: rawData.drivers.map(transformDriver),
      maintenanceOrders: rawData.maintenance_orders.map(transformMaintenanceOrder),
      vehicleSchedules: rawData.vehicle_schedules.map(transformVehicleSchedule),
    };

    return transformedData;
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    throw error;
  }
}

// You will add more functions here for specific CRUD operations (e.g., addVehicle, updateDriver, etc.)
// in subsequent steps.