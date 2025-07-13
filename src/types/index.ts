export interface Driver {
  id: string;
  name: string;
  email: string;
  age: number | null;
  address: string | null;
  idNumber: string;
  userId: string | null;
  assignedVehicle?: {
    id: string;
    name: string;
    make: string | null;
    model: string | null;
    year: number | null;
    licensePlate: string | null;
    mileage: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  name: string;
  status: 'active' | 'maintenance' | 'idle';
  vin: string | null;
  licensePlate: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  mileage: number | null;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  fuelType: string | null;
  maintenanceCost: number | null;
  assignedDriverId: string | null;
  userId?: string | null;
  assignedDriverName?: string | null;
  assignedDriverEmail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceOrder {
  id: string;
  orderNumber: string;
  vehicleId: string;
  status: 'pending_authorization' | 'scheduled' | 'active' | 'completed';
  startDate: string;
  estimatedCompletionDate: string;
  location: string | null;
  type: string | null;
  urgent: boolean | null;
  description: string | null;
  quotationDetails: string | null;
  comments: string | null;
  cost: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleSchedule {
  id: string;
  vehicleId: string;
  driverId: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: 'scheduled' | 'active' | 'completed';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

export interface FleetData {
  vehicles: Vehicle[];
  drivers: Driver[];
  maintenanceOrders: MaintenanceOrder[];
  vehicleSchedules: VehicleSchedule[];
  summary?: DashboardSummary;
}

// New types for advanced vehicle data management
export interface VehicleQueryParams {
  search?: string;
  status?: string[];
  unassignedOnly?: boolean;
  sortBy?: 'name' | 'status' | 'mileage' | 'maintenanceCost' | 'assignedDriver';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedVehiclesResponse {
  vehicles: Vehicle[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// New types for advanced driver data management
export interface DriverQueryParams {
  search?: string;
  emailSearch?: string;
  sortBy?: 'name' | 'email' | 'idNumber' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedDriversResponse {
  drivers: Driver[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// New types for maintenance orders pagination
export interface MaintenanceOrderQueryParams {
  search?: string;
  status?: string[];
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  sortBy?: 'orderNumber' | 'vehicleName' | 'startDate' | 'estimatedCompletionDate' | 'cost' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedMaintenanceOrdersResponse {
  maintenanceOrders: MaintenanceOrder[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// New types for vehicle schedules pagination
export interface VehicleScheduleQueryParams {
  search?: string;
  status?: string[];
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  sortBy?: 'vehicleName' | 'driverName' | 'startDate' | 'endDate' | 'duration' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedVehicleSchedulesResponse {
  vehicleSchedules: VehicleSchedule[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Gantt Chart Types
export type GanttItemType = 'schedule' | 'maintenance';

export interface GanttItem {
  id: string;
  vehicleId: string;
  type: GanttItemType;
  title: string;
  startDate: string;
  endDate: string;
  color: string;
  details: {
    driverName?: string;
    orderNumber?: string;
    description?: string;
    status: string;
    urgent?: boolean;
    location?: string;
    notes?: string;
  };
}

export interface GanttVehicle {
  id: string;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  status: 'active' | 'maintenance' | 'idle';
}

// Dashboard Summary Types
export interface MaintenanceOrderStatusCounts {
  active: number;
  scheduled: number;
  pending_authorization: number;
}

export interface VehicleScheduleStatusCounts {
  active: number;
  scheduled: number;
}

export interface DashboardSummary {
  totalVehicles: number;
  totalDrivers: number;
  activeVehiclesCount: number;
  totalMaintenanceCost: number;
  vehicleStatusCounts: {
    active: number;
    maintenance: number;
    idle: number;
  };
  maintenanceOrdersStatusCounts: MaintenanceOrderStatusCounts;
  vehicleSchedulesStatusCounts: VehicleScheduleStatusCounts;
  highestMaintenanceCostVehicle: {
    id: string;
    name: string;
    maintenanceCost: number;
    licensePlate: string | null;
  } | null;
  lowestMaintenanceCostVehicle: {
    id: string;
    name: string;
    maintenanceCost: number;
    licensePlate: string | null;
  } | null;
}