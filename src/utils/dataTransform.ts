import { Driver, Vehicle, MaintenanceOrder, VehicleSchedule } from '../types';

// Transform snake_case database fields to camelCase for UI consistency
export function transformDriver(dbDriver: any): Driver {
  return {
    id: dbDriver.id,
    name: dbDriver.name,
    email: dbDriver.email,
    age: dbDriver.age,
    address: dbDriver.address,
    idNumber: dbDriver.id_number,
    userId: dbDriver.user_id,
    createdAt: dbDriver.created_at,
    updatedAt: dbDriver.updated_at,
  };
}

export function transformVehicle(dbVehicle: any): Vehicle {
  return {
    id: dbVehicle.id,
    name: dbVehicle.name,
    status: dbVehicle.status,
    vin: dbVehicle.VIN || dbVehicle.vin, // Handle both VIN and vin from database
    licensePlate: dbVehicle.license_plate,
    make: dbVehicle.marca || dbVehicle.make, // Handle both marca and make from database
    model: dbVehicle.model,
    year: dbVehicle.year,
    mileage: dbVehicle.mileage,
    lastMaintenance: dbVehicle.last_maintenance,
    nextMaintenance: dbVehicle.next_maintenance,
    fuelType: dbVehicle.fuel_type,
    maintenanceCost: dbVehicle.maintenance_cost,
    assignedDriverId: dbVehicle.driver_id || dbVehicle.assigned_driver_id, // Handle both field names
    createdAt: dbVehicle.created_at,
    updatedAt: dbVehicle.updated_at,
  };
}

export function transformMaintenanceOrder(dbOrder: any): MaintenanceOrder {
  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    vehicleId: dbOrder.vehicle_id,
    status: dbOrder.status,
    startDate: dbOrder.start_date,
    estimatedCompletionDate: dbOrder.estimated_completion_date,
    location: dbOrder.location,
    type: dbOrder.type,
    urgent: dbOrder.urgent,
    description: dbOrder.description,
    quotationDetails: dbOrder.quotation_details,
    comments: dbOrder.comments,
    cost: dbOrder.cost,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
  };
}

export function transformVehicleSchedule(dbSchedule: any): VehicleSchedule {
  return {
    id: dbSchedule.id,
    vehicleId: dbSchedule.vehicle_id,
    driverId: dbSchedule.driver_id,
    startDate: dbSchedule.start_date,
    endDate: dbSchedule.end_date,
    notes: dbSchedule.notes,
    userId: dbSchedule.user_id,
    createdAt: dbSchedule.created_at,
    updatedAt: dbSchedule.updated_at,
  };
}

// Transform camelCase UI fields back to snake_case for database operations
export function transformDriverForDB(driver: Partial<Driver>): any {
  const dbDriver: any = {};
  
  if (driver.id !== undefined) dbDriver.id = driver.id;
  if (driver.name !== undefined) dbDriver.name = driver.name;
  if (driver.email !== undefined) dbDriver.email = driver.email;
  if (driver.age !== undefined) dbDriver.age = driver.age;
  if (driver.address !== undefined) dbDriver.address = driver.address;
  if (driver.idNumber !== undefined) dbDriver.id_number = driver.idNumber;
  if (driver.userId !== undefined) dbDriver.user_id = driver.userId;
  
  return dbDriver;
}

export function transformVehicleForDB(vehicle: Partial<Vehicle>): any {
  const dbVehicle: any = {};
  
  if (vehicle.id !== undefined) dbVehicle.id = vehicle.id;
  if (vehicle.name !== undefined) dbVehicle.name = vehicle.name;
  if (vehicle.status !== undefined) dbVehicle.status = vehicle.status;
  if (vehicle.vin !== undefined) dbVehicle.VIN = vehicle.vin; // Use VIN field as per schema
  if (vehicle.licensePlate !== undefined) dbVehicle.license_plate = vehicle.licensePlate;
  if (vehicle.make !== undefined) dbVehicle.marca = vehicle.make; // Use marca field as per schema
  if (vehicle.model !== undefined) dbVehicle.model = vehicle.model;
  if (vehicle.year !== undefined) dbVehicle.year = vehicle.year;
  if (vehicle.mileage !== undefined) dbVehicle.mileage = vehicle.mileage;
  if (vehicle.lastMaintenance !== undefined) dbVehicle.last_maintenance = vehicle.lastMaintenance;
  if (vehicle.nextMaintenance !== undefined) dbVehicle.next_maintenance = vehicle.nextMaintenance;
  if (vehicle.fuelType !== undefined) dbVehicle.fuel_type = vehicle.fuelType;
  if (vehicle.maintenanceCost !== undefined) dbVehicle.maintenance_cost = vehicle.maintenanceCost;
  if (vehicle.assignedDriverId !== undefined) dbVehicle.driver_id = vehicle.assignedDriverId; // Use driver_id as per schema
  if (vehicle.userId !== undefined) dbVehicle.user_id = vehicle.userId;
  
  return dbVehicle;
}

export function transformMaintenanceOrderForDB(order: Partial<MaintenanceOrder>): any {
  const dbOrder: any = {};
  
  if (order.id !== undefined) dbOrder.id = order.id;
  if (order.orderNumber !== undefined) dbOrder.order_number = order.orderNumber;
  if (order.vehicleId !== undefined) dbOrder.vehicle_id = order.vehicleId;
  if (order.status !== undefined) dbOrder.status = order.status;
  if (order.startDate !== undefined) dbOrder.start_date = order.startDate;
  if (order.estimatedCompletionDate !== undefined) dbOrder.estimated_completion_date = order.estimatedCompletionDate;
  if (order.location !== undefined) dbOrder.location = order.location;
  if (order.type !== undefined) dbOrder.type = order.type;
  if (order.urgent !== undefined) dbOrder.urgent = order.urgent;
  if (order.description !== undefined) dbOrder.description = order.description;
  if (order.quotationDetails !== undefined) dbOrder.quotation_details = order.quotationDetails;
  if (order.comments !== undefined) dbOrder.comments = order.comments;
  if (order.cost !== undefined) dbOrder.cost = order.cost;
  
  return dbOrder;
}

export function transformVehicleScheduleForDB(schedule: Partial<VehicleSchedule>): any {
  const dbSchedule: any = {};
  
  if (schedule.id !== undefined) dbSchedule.id = schedule.id;
  if (schedule.vehicleId !== undefined) dbSchedule.vehicle_id = schedule.vehicleId;
  if (schedule.driverId !== undefined) dbSchedule.driver_id = schedule.driverId;
  if (schedule.startDate !== undefined) dbSchedule.start_date = schedule.startDate;
  if (schedule.endDate !== undefined) dbSchedule.end_date = schedule.endDate;
  if (schedule.notes !== undefined) dbSchedule.notes = schedule.notes;
  if (schedule.userId !== undefined) dbSchedule.user_id = schedule.userId;
  
  return dbSchedule;
}