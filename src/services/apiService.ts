import { FleetData, Driver, Vehicle, MaintenanceOrder, VehicleSchedule, User, VehicleQueryParams, PaginatedVehiclesResponse, DriverQueryParams, PaginatedDriversResponse, MaintenanceOrderQueryParams, PaginatedMaintenanceOrdersResponse, VehicleScheduleQueryParams, PaginatedVehicleSchedulesResponse } from '../types';
import { MaintenanceOrderSummary } from '../types';

// IMPORTANT: Replace this with the actual URL of your running backend service.
// For local development, it might be something like 'http://localhost:3000'
// or the port your Node.js backend is listening on.
const BASE_URL = 'https://flotaris-backend.onrender.com/api'; // Assuming a common /api prefix

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

    // Handle responses that don't have JSON content (like 204 No Content for DELETE operations)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null;
    }

    // Check if response has JSON content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    // Only parse JSON if we expect it to be there
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }

    return JSON.parse(text);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Fleet Data Service
export async function fetchFleetData(): Promise<FleetData> {
  try {
    const data = await apiCall('/fleet');

    // Backend now returns camelCase data directly
    const fleetData: FleetData = {
      vehicles: data.vehicles,
      drivers: data.drivers,
      maintenanceOrders: data.maintenanceOrders,
      vehicleSchedules: data.vehicleSchedules,
      summary: data.summary, // New aggregated dashboard data
    };

    return fleetData;
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
    const response = await apiCall('/drivers', {
      method: 'POST',
      body: JSON.stringify(driverData),
    });
    return response;
  },

  async updateDriver(id: string, driverData: Partial<Driver>): Promise<Driver> {
    const response = await apiCall(`/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(driverData),
    });
    return response;
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

  // New method for paginated drivers with filtering and sorting
  async fetchPaginatedDrivers(params: DriverQueryParams = {}): Promise<PaginatedDriversResponse> {
    const queryParams = new URLSearchParams();

    // Add search parameters
    if (params.search) {
      queryParams.append('search', params.search);
    }
    if (params.emailSearch) {
      queryParams.append('emailSearch', params.emailSearch);
    }

    // Add sorting parameters
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    // Add pagination parameters
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = `/drivers/paginated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiCall(endpoint);
    return response;
  },
};

// Vehicle Service
export const vehicleService = {
  async addVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await apiCall('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
    return response;
  },

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const response = await apiCall(`/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vehicleData),
    });
    return response;
  },

  async deleteVehicle(id: string): Promise<void> {
    await apiCall(`/vehicles/${id}`, { method: 'DELETE' });
  },

  async getVehicleById(id: string): Promise<Vehicle> {
    const response = await apiCall(`/vehicles/${id}`);
    return response;
  },

  async updateVehicleStatusAndDriver(id: string, status?: string, driverId?: string | null): Promise<Vehicle> {
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (driverId !== undefined) updateData.assignedDriverId = driverId;

    const response = await apiCall(`/vehicles/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return response;
  },

  // New method for paginated vehicles with filtering and sorting
  async fetchPaginatedVehicles(params: VehicleQueryParams = {}): Promise<PaginatedVehiclesResponse> {
    const queryParams = new URLSearchParams();

    // Add search parameter
    if (params.search) {
      queryParams.append('search', params.search);
    }

    // Add status filters
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => queryParams.append('status', status));
    }

    // Add unassigned filter
    if (params.unassignedOnly) {
      queryParams.append('unassignedOnly', 'true');
    }

    // Add sorting parameters
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    // Add pagination parameters
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = `/vehicles/paginated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiCall(endpoint);
    return response;
  },
};

// Maintenance Order Service
export const maintenanceOrderService = {
  async addMaintenanceOrder(orderData: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const response = await apiCall('/maintenance-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response;
  },

  async updateMaintenanceOrder(id: string, orderData: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const response = await apiCall(`/maintenance-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
    return response;
  },

  async deleteMaintenanceOrder(id: string): Promise<void> {
    await apiCall(`/maintenance-orders/${id}`, { method: 'DELETE' });
  },

  async updateMaintenanceOrderStatus(id: string, status: string, additionalData?: any): Promise<MaintenanceOrder> {
    const updateData = { status, ...additionalData };
    const response = await apiCall(`/maintenance-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
    return response;
  },

  // New method for paginated maintenance orders with filtering and sorting
  async fetchPaginatedMaintenanceOrders(params: MaintenanceOrderQueryParams = {}): Promise<PaginatedMaintenanceOrdersResponse> {
    const queryParams = new URLSearchParams();

    // Add search parameter
    if (params.search) {
      queryParams.append('search', params.search);
    }

    // Add status filters
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => queryParams.append('status', status));
    }

    // Add date range filters
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    // Add sorting parameters
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    // Add pagination parameters
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = `/maintenance-orders/paginated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiCall(endpoint);
    return response;
  },

  // New method for fetching maintenance order summary statistics
  async fetchMaintenanceOrderSummary(): Promise<MaintenanceOrderSummary> {
    const response = await apiCall('/maintenance-orders/summary');
    return response;
  },
};

// Vehicle Schedule Service
export const vehicleScheduleService = {
  async addVehicleSchedule(scheduleData: Partial<VehicleSchedule>): Promise<VehicleSchedule> {
    const response = await apiCall('/vehicle-schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
    return response;
  },

  async updateVehicleSchedule(id: string, scheduleData: Partial<VehicleSchedule>): Promise<VehicleSchedule> {
    const response = await apiCall(`/vehicle-schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
    return response;
  },

  async deleteVehicleSchedule(id: string): Promise<void> {
    await apiCall(`/vehicle-schedules/${id}`, { method: 'DELETE' });
  },

  async updateVehicleScheduleStatus(id: string, status: string): Promise<VehicleSchedule> {
    const response = await apiCall(`/vehicle-schedules/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response;
  },

  async fetchActiveSchedulesForVehicle(vehicleId: string): Promise<VehicleSchedule[]> {
    const response = await apiCall(`/vehicle-schedules/vehicle/${vehicleId}/active`);
    return response;
  },

  async fetchOtherSchedulesForVehicle(vehicleId: string, excludeScheduleId: string, statuses: string[]): Promise<VehicleSchedule[]> {
    const statusQuery = statuses.map(s => `status=${s}`).join('&');
    const response = await apiCall(`/vehicle-schedules/vehicle/${vehicleId}/other?exclude=${excludeScheduleId}&${statusQuery}`);
    return response;
  },

  // New method for paginated vehicle schedules with filtering and sorting
  async fetchPaginatedVehicleSchedules(params: VehicleScheduleQueryParams = {}): Promise<PaginatedVehicleSchedulesResponse> {
    const queryParams = new URLSearchParams();

    // Add search parameter
    if (params.search) {
      queryParams.append('search', params.search);
    }

    // Add status filters
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => queryParams.append('status', status));
    }

    // Add date range filters
    if (params.startDate) {
      queryParams.append('startDate', params.startDate);
    }
    if (params.endDate) {
      queryParams.append('endDate', params.endDate);
    }

    // Add sorting parameters
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }

    // Add pagination parameters
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const endpoint = `/vehicle-schedules/paginated${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiCall(endpoint);
    return response;
  },
};

// Query Service for specific data queries
export const queryService = {
  async fetchMaintenanceOrdersByVehicleAndStatus(vehicleId: string, statuses: string[]): Promise<MaintenanceOrder[]> {
    const statusQuery = statuses.map(s => `status=${s}`).join('&');
    const response = await apiCall(`/maintenance-orders/vehicle/${vehicleId}?${statusQuery}`);
    return response;
  },
};