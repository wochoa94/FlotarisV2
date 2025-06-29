import {
  transformDriver,
  transformVehicle,
  transformMaintenanceOrder,
  transformVehicleSchedule,
  transformDriverForDB,
  transformVehicleForDB,
  transformMaintenanceOrderForDB,
  transformVehicleScheduleForDB,
} from '../utils/dataTransform';
import { FleetData, Driver, Vehicle, MaintenanceOrder, VehicleSchedule, User } from '../types';

// IMPORTANT: Replace this with the actual URL of your running backend service.
// For local development, it might be something like 'http://localhost:3000'
// or the port your Node.js backend is listening on.
const BASE_URL = 'http://localhost:3000/api'; // Assuming a common /api prefix

// Helper function to handle API calls
async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('auth_token'); // Adjust based on your token storage strategy
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Fleet Data Service
export async function fetchFleetData(): Promise<FleetData> {
  try {
    const rawData = await apiCall('/fleet');

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

// Authentication Service
export const authService = {
  async signIn(email: string, password: string): Promise<{ user?: User; error?: Error }> {
    try {
      const response = await apiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }

      return { 
        user: {
          id: response.user.id,
          email: response.user.email,
          isAdmin: response.user.email === 'wochoa.automata@gmail.com',
        }
      };
    } catch (error) {
      return { error: error as Error };
    }
  },

  async signOut(): Promise<void> {
    try {
      await apiCall('/auth/signout', { method: 'POST' });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      localStorage.removeItem('auth_token');
    }
  },

  async getSession(): Promise<{ user?: User }> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return {};

      const response = await apiCall('/auth/session');
      return {
        user: {
          id: response.user.id,
          email: response.user.email,
          isAdmin: response.user.email === 'wochoa.automata@gmail.com',
        }
      };
    } catch (error) {
      localStorage.removeItem('auth_token');
      return {};
    }
  },

  // Note: For real-time auth state changes, you might need WebSocket or polling
  onAuthStateChange(callback: (user: User | null) => void): { unsubscribe: () => void } {
    // This is a simplified implementation
    // In a real app, you might use WebSocket or periodic checks
    return { unsubscribe: () => {} };
  },
};

// Driver Service
export const driverService = {
  async addDriver(driverData: Partial<Driver>): Promise<Driver> {
    const dbData = transformDriverForDB(driverData);
    const response = await apiCall('/drivers', {
      method: 'POST',
      body: JSON.stringify(dbData),
    });
    return transformDriver(response);
  },

  async updateDriver(id: string, driverData: Partial<Driver>): Promise<Driver> {
    const dbData = transformDriverForDB(driverData);
    const response = await apiCall(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dbData),
    });
    return transformDriver(response);
  },

  async deleteDriver(id: string): Promise<void> {
    await apiCall(`/drivers/${id}`, { method: 'DELETE' });
  },

  async checkEmailUniqueness(email: string): Promise<boolean> {
    try {
      const response = await apiCall(`/drivers/check-email?email=${encodeURIComponent(email)}`);
      return response.isUnique;
    } catch (error) {
      console.error('Error checking email uniqueness:', error);
      return false;
    }
  },
};

// Vehicle Service
export const vehicleService = {
  async addVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const dbData = transformVehicleForDB(vehicleData);
    const response = await apiCall('/vehicles', {
      method: 'POST',
      body: JSON.stringify(dbData),
    });
    return transformVehicle(response);
  },

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const dbData = transformVehicleForDB(vehicleData);
    const response = await apiCall(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dbData),
    });
    return transformVehicle(response);
  },

  async deleteVehicle(id: string): Promise<void> {
    await apiCall(`/vehicles/${id}`, { method: 'DELETE' });
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    const response = await apiCall(`/vehicles/${id}`);
    return transformVehicle(response);
  },

  async updateVehicleStatusAndDriver(id: string, status?: string, driverId?: string | null): Promise<Vehicle> {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (driverId !== undefined) updateData.driver_id = driverId;

    const response = await apiCall(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return transformVehicle(response);
  },
};

// Maintenance Order Service
export const maintenanceOrderService = {
  async addMaintenanceOrder(orderData: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const dbData = transformMaintenanceOrderForDB(orderData);
    const response = await apiCall('/maintenance-orders', {
      method: 'POST',
      body: JSON.stringify(dbData),
    });
    return transformMaintenanceOrder(response);
  },

  async updateMaintenanceOrder(id: string, orderData: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const dbData = transformMaintenanceOrderForDB(orderData);
    const response = await apiCall(`/maintenance-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dbData),
    });
    return transformMaintenanceOrder(response);
  },

  async deleteMaintenanceOrder(id: string): Promise<void> {
    await apiCall(`/maintenance-orders/${id}`, { method: 'DELETE' });
  },

  async updateMaintenanceOrderStatus(id: string, status: string, additionalData?: any): Promise<MaintenanceOrder> {
    const updateData = { status, ...additionalData };
    const dbData = transformMaintenanceOrderForDB(updateData);
    const response = await apiCall(`/maintenance-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(dbData),
    });
    return transformMaintenanceOrder(response);
  },
};

// Vehicle Schedule Service
export const vehicleScheduleService = {
  async addVehicleSchedule(scheduleData: Partial<VehicleSchedule>): Promise<VehicleSchedule> {
    const dbData = transformVehicleScheduleForDB(scheduleData);
    const response = await apiCall('/vehicle-schedules', {
      method: 'POST',
      body: JSON.stringify(dbData),
    });
    return transformVehicleSchedule(response);
  },

  async updateVehicleSchedule(id: string, scheduleData: Partial<VehicleSchedule>): Promise<VehicleSchedule> {
    const dbData = transformVehicleScheduleForDB(scheduleData);
    const response = await apiCall(`/vehicle-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dbData),
    });
    return transformVehicleSchedule(response);
  },

  async deleteVehicleSchedule(id: string): Promise<void> {
    await apiCall(`/vehicle-schedules/${id}`, { method: 'DELETE' });
  },

  async updateVehicleScheduleStatus(id: string, status: string): Promise<VehicleSchedule> {
    const response = await apiCall(`/vehicle-schedules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return transformVehicleSchedule(response);
  },

  async fetchActiveSchedulesForVehicle(vehicleId: string): Promise<VehicleSchedule[]> {
    const response = await apiCall(`/vehicle-schedules/vehicle/${vehicleId}/active`);
    return response.map(transformVehicleSchedule);
  },

  async fetchOtherSchedulesForVehicle(vehicleId: string, excludeScheduleId: string, statuses: string[]): Promise<VehicleSchedule[]> {
    const statusQuery = statuses.map(s => `status=${s}`).join('&');
    const response = await apiCall(`/vehicle-schedules/vehicle/${vehicleId}/other?exclude=${excludeScheduleId}&${statusQuery}`);
    return response.map(transformVehicleSchedule);
  },
};

// Query Service for specific data queries
export const queryService = {
  async fetchMaintenanceOrdersByVehicleAndStatus(vehicleId: string, statuses: string[]): Promise<MaintenanceOrder[]> {
    const statusQuery = statuses.map(s => `status=${s}`).join('&');
    const response = await apiCall(`/maintenance-orders/vehicle/${vehicleId}?${statusQuery}`);
    return response.map(transformMaintenanceOrder);
  },
};