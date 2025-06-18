import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { FleetDataProvider, useFleetData } from './hooks/useFleetData';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { AddVehicle } from './pages/AddVehicle';
import { EditVehicle } from './pages/EditVehicle';
import { VehicleDetail } from './pages/VehicleDetail';
import { Drivers } from './pages/Drivers';
import { DriverDetail } from './pages/DriverDetail';
import { MaintenanceOrders } from './pages/MaintenanceOrders';
import { MaintenanceOrderDetail } from './pages/MaintenanceOrderDetail';
import { AddMaintenanceOrder } from './pages/AddMaintenanceOrder';
import { EditMaintenanceOrder } from './pages/EditMaintenanceOrder';
import { VehicleSchedules } from './pages/VehicleSchedules';
import { AddVehicleSchedule } from './pages/AddVehicleSchedule';
import { SchedulesOverview } from './pages/SchedulesOverview';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isReconciling } = useFleetData();

  // Show loading spinner during authentication or data reconciliation
  if (authLoading || isReconciling) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">
            {authLoading ? 'Authenticating...' : 'Preparing your fleet data...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles" element={
        <ProtectedRoute>
          <Layout>
            <Vehicles />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/new" element={
        <ProtectedRoute>
          <Layout>
            <AddVehicle />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/:id/edit" element={
        <ProtectedRoute>
          <Layout>
            <EditVehicle />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicles/:id" element={
        <ProtectedRoute>
          <Layout>
            <VehicleDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/drivers" element={
        <ProtectedRoute>
          <Layout>
            <Drivers />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/drivers/:id" element={
        <ProtectedRoute>
          <Layout>
            <DriverDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/maintenance-orders" element={
        <ProtectedRoute>
          <Layout>
            <MaintenanceOrders />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/maintenance-orders/new" element={
        <ProtectedRoute>
          <Layout>
            <AddMaintenanceOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/maintenance-orders/:id/edit" element={
        <ProtectedRoute>
          <Layout>
            <EditMaintenanceOrder />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/maintenance-orders/:id" element={
        <ProtectedRoute>
          <Layout>
            <MaintenanceOrderDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicle-schedules" element={
        <ProtectedRoute>
          <Layout>
            <VehicleSchedules />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/vehicle-schedules/new" element={
        <ProtectedRoute>
          <Layout>
            <AddVehicleSchedule />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/schedules-overview" element={
        <ProtectedRoute>
          <Layout>
            <SchedulesOverview />
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <FleetDataProvider>
          <AppRoutes />
        </FleetDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;