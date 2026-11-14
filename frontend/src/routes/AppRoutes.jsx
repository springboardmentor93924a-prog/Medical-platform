import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { useAuth } from '../context/AuthContext';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Dashboards
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import PharmacistDashboard from '../pages/dashboard/PharmacistDashboard';
import StaffDashboard from '../pages/dashboard/StaffDashboard';
import SupplierDashboard from '../pages/dashboard/SupplierDashboard';

// Module Pages
import MedicinesPage from '../pages/medicines/MedicinesPage';
import CategoriesPage from '../pages/categories/CategoriesPage';
import SuppliersPage from '../pages/suppliers/SuppliersPage';
import PurchaseOrdersPage from '../pages/purchase-orders/PurchaseOrdersPage';
import PurchaseOrderDetailPage from '../pages/purchase-orders/PurchaseOrderDetailPage';
import StockMovementsPage from '../pages/inventory/StockMovementsPage';
import ExpiryTrackingPage from '../pages/inventory/ExpiryTrackingPage';
import ReportsPage from '../pages/reports/ReportsPage';
import UsersPage from '../pages/users/UsersPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';
import SystemMonitoringPage from '../pages/system/SystemMonitoringPage';
import SettingsPage from '../pages/settings/SettingsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import NotificationsPage from '../pages/notifications/NotificationsPage';

// Advanced Workflow Modules
import WastagePage from '../pages/wastage/WastagePage';
import FefoPage from '../pages/fefo/FefoPage';
import FeedbackPage from '../pages/feedback/FeedbackPage';
import BackupRestorePage from '../pages/backup/BackupRestorePage';

// Dynamic Dashboard Resolver based on user.role
const RoleDashboard = () => {
  const { user } = useAuth();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'PHARMACIST':
      return <PharmacistDashboard />;
    case 'STAFF':
      return <StaffDashboard />;
    case 'SUPPLIER':
      return <SupplierDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div className="text-center max-w-md">
      <h1 className="text-6xl font-extrabold text-emerald-600">404</h1>
      <h2 className="text-2xl font-bold text-gray-900 mt-2">Page Not Found</h2>
      <p className="text-sm text-gray-500 mt-2">The requested application view does not exist or has been relocated.</p>
      <a 
        href="/dashboard" 
        className="mt-6 inline-block px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition"
      >
        Return to Dashboard
      </a>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Branded Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Redirect root to dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Main Application Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dynamic Role Dashboard */}
        <Route path="/dashboard" element={<RoleDashboard />} />

        {/* Inventory & Pharmacy Modules */}
        <Route 
          path="/medicines" 
          element={<MedicinesPage />} 
        />
        <Route 
          path="/categories" 
          element={<CategoriesPage />} 
        />
        <Route 
          path="/suppliers" 
          element={<SuppliersPage />} 
        />

        {/* Purchase Orders */}
        <Route 
          path="/purchase-orders" 
          element={<PurchaseOrdersPage />} 
        />
        <Route 
          path="/purchase-orders/:id" 
          element={<PurchaseOrderDetailPage />} 
        />

        {/* Stock Movements & Expiry Tracking */}
        <Route 
          path="/inventory/movements" 
          element={<StockMovementsPage />} 
        />
        <Route 
          path="/inventory/expiry" 
          element={<ExpiryTrackingPage />} 
        />

        {/* Reports & Analytics */}
        <Route 
          path="/reports" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST']}>
              <ReportsPage />
            </ProtectedRoute>
          } 
        />

        {/* Wastage & Loss Management (Admin, Pharmacist, Staff) */}
        <Route 
          path="/wastage" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'STAFF']}>
              <WastagePage />
            </ProtectedRoute>
          } 
        />

        {/* FEFO Batch Dispensing & Monitoring (Admin, Pharmacist, Staff) */}
        <Route 
          path="/fefo" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'STAFF']}>
              <FefoPage />
            </ProtectedRoute>
          } 
        />

        {/* User Inquiries & Feedback (All Authenticated Roles) */}
        <Route 
          path="/feedback" 
          element={<FeedbackPage />} 
        />

        {/* Admin Only Modules */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audit-logs" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/backup-restore" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <BackupRestorePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/system/monitoring" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SystemMonitoringPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />

        {/* Profile & Notifications */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
