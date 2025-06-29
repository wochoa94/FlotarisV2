
export type Database = {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: string;
          name: string;
          email: string;
          age: number | null;
          address: string | null;
          id_number: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          age?: number | null;
          address?: string | null;
          id_number: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          age?: number | null;
          address?: string | null;
          id_number?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicles: {
        Row: {
          id: string;
          name: string;
          status: 'active' | 'maintenance' | 'idle';
          vin: string;
          license_plate: string | null;
          make: string | null;
          model: string | null;
          year: number | null;
          mileage: number | null;
          last_maintenance: string | null;
          next_maintenance: string | null;
          fuel_type: string | null;
          maintenance_cost: number | null;
          assigned_driver_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status: 'active' | 'maintenance' | 'idle';
          vin: string;
          license_plate?: string | null;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          mileage?: number | null;
          last_maintenance?: string | null;
          next_maintenance?: string | null;
          fuel_type?: string | null;
          maintenance_cost?: number | null;
          assigned_driver_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: 'active' | 'maintenance' | 'idle';
          vin?: string;
          license_plate?: string | null;
          make?: string | null;
          model?: string | null;
          year?: number | null;
          mileage?: number | null;
          last_maintenance?: string | null;
          next_maintenance?: string | null;
          fuel_type?: string | null;
          maintenance_cost?: number | null;
          assigned_driver_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_orders: {
        Row: {
          id: string;
          order_number: string;
          vehicle_id: string;
          status: 'pending_authorization' | 'scheduled' | 'active' | 'completed';
          start_date: string;
          estimated_completion_date: string;
          location: string | null;
          type: string | null;
          urgent: boolean | null;
          description: string | null;
          quotation_details: string | null;
          comments: string | null;
          cost: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          vehicle_id: string;
          status: 'pending_authorization' | 'scheduled' | 'active' | 'completed';
          start_date: string;
          estimated_completion_date: string;
          location?: string | null;
          type?: string | null;
          urgent?: boolean | null;
          description?: string | null;
          quotation_details?: string | null;
          comments?: string | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          vehicle_id?: string;
          status?: 'pending_authorization' | 'scheduled' | 'active' | 'completed';
          start_date?: string;
          estimated_completion_date?: string;
          location?: string | null;
          type?: string | null;
          urgent?: boolean | null;
          description?: string | null;
          quotation_details?: string | null;
          comments?: string | null;
          cost?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      vehicle_schedules: {
        Row: {
          id: string;
          vehicle_id: string;
          driver_id: string;
          start_date: string;
          end_date: string;
          notes: string | null;
          status: 'scheduled' | 'active' | 'completed';
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          driver_id: string;
          start_date: string;
          end_date: string;
          notes?: string | null;
          status?: 'scheduled' | 'active' | 'completed';
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          driver_id?: string;
          start_date?: string;
          end_date?: string;
          notes?: string | null;
          status?: 'scheduled' | 'active' | 'completed';
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};