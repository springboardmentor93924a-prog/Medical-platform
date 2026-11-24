import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import RoleRoute from './components/auth/RoleRoute';

// ── Admin Modules ─────────────────────────────────────────────────────────────
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminMedicinesPage from './pages/admin/AdminMedicinesPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminSuppliersPage from './pages/admin/AdminSuppliersPage';
import AdminPurchasesPage from './pages/admin/AdminPurchasesPage';
import AdminStockPage from './pages/admin/AdminStockPage';
import AdminExpiryPage from './pages/admin/AdminExpiryPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminMonitoringPage from './pages/admin/AdminMonitoringPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminBackupRestorePage from './pages/admin/AdminBackupRestorePage';
import FeedbackHubPage from './pages/feedback/FeedbackHubPage';

// ── Pharmacist Modules ────────────────────────────────────────────────────────
import PharmacistDashboardPage from './pages/pharmacist/PharmacistDashboardPage';
import PharmacistMedicinesPage from './pages/pharmacist/PharmacistMedicinesPage';
import PharmacistCategoriesPage from './pages/pharmacist/PharmacistCategoriesPage';
import PharmacistStockPage from './pages/pharmacist/PharmacistStockPage';
import PharmacistExpiryPage from './pages/pharmacist/PharmacistExpiryPage';
import PharmacistPurchasesPage from './pages/pharmacist/PharmacistPurchasesPage';
import PharmacistSuppliersPage from './pages/pharmacist/PharmacistSuppliersPage';
import PharmacistReportsPage from './pages/pharmacist/PharmacistReportsPage';
import PharmacistNotificationsPage from './pages/pharmacist/PharmacistNotificationsPage';

// ── Staff Modules ─────────────────────────────────────────────────────────────
import StaffDashboardPage from './pages/staff/StaffDashboardPage';
import StaffMedicinesPage from './pages/staff/StaffMedicinesPage';
import StaffSearchPage from './pages/staff/StaffSearchPage';
import StaffStockCheckPage from './pages/staff/StaffStockCheckPage';
import StaffReceivePage from './pages/staff/StaffReceivePage';
import StaffExpiryPage from './pages/staff/StaffExpiryPage';
import StaffNotificationsPage from './pages/staff/StaffNotificationsPage';
import StaffProfilePage from './pages/staff/StaffProfilePage';

// ── Wastage Management Modules (Independent Module for All Roles) ─────────────
import AdminWastagePage from './pages/admin/AdminWastagePage';
import PharmacistWastagePage from './pages/pharmacist/PharmacistWastagePage';
import StaffWastagePage from './pages/staff/StaffWastagePage';

// ── FEFO (First Expired, First Out) Inventory & Allocation Module ─────────────
import FefoPage from './pages/fefo/FefoPage';

// ── AI-Based Inventory Recommendations & Demand Forecasting ─────────────────
import AiForecastPage from './pages/ai/AiForecastPage';

// ── Pharmacist Redesigned Reference Pages ─────────────────────────────────
import PharmacistProfilePage from './pages/pharmacist/PharmacistProfilePage';
import UserProfilePage from './pages/auth/UserProfilePage';

// ── Supplier Dedicated Portal Pages ─────────────────────────────────────────
import SupplierDashboardPage from './pages/supplier/SupplierDashboardPage';
import SupplierOrdersPage from './pages/supplier/SupplierOrdersPage';
import SupplierMedicinesPage from './pages/supplier/SupplierMedicinesPage';
import SupplierDeliveriesPage from './pages/supplier/SupplierDeliveriesPage';
import SupplierHistoryPage from './pages/supplier/SupplierHistoryPage';
import SupplierNotificationsPage from './pages/supplier/SupplierNotificationsPage';
import SupplierProfilePage from './pages/supplier/SupplierProfilePage';

// ── Legacy Catalog Pages (Backwards-compatibility) ───────────────────────────
import MedicinesPage from './pages/medicines/MedicinesPage';
import InventoryPage from './pages/inventory/InventoryPage';
import OrdersPage from './pages/orders/OrdersPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';

// ── Auth Pages ────────────────────────────────────────────────────────────────
import LoginPage from './pages/login/LoginPage';
import SignupPage from './pages/signup/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import AccountDeactivatedPage from './pages/auth/AccountDeactivatedPage';

import { ROLES, getRoleDashboardPath } from './utils/roles';
import './App.css';

/**
 * Basic login guard — ensures user is authenticated before viewing the shell.
 */
function ProtectedRoute({ children }) {
  const storedUser = localStorage.getItem('medistock_user');
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/**
 * Root index redirector — automatically routes the authenticated user
 * to their specific role dashboard (/admin, /pharmacist, /staff, /supplier).
 */
function RoleHomeRedirect() {
  const storedUser = localStorage.getItem('medistock_user');
  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    const targetPath = getRoleDashboardPath(user.role);
    return <Navigate to={targetPath} replace />;
  } catch (_e) {
    return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/account-deactivated" element={<AccountDeactivatedPage />} />

        {/* Protected Dashboard Shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default entrypoint — routes to user's role dashboard */}
          <Route index element={<RoleHomeRedirect />} />

          {/* ══════════════════════════════════════════════════════════
              1. ADMIN DASHBOARD & MANAGEMENT MODULES (12 MODULES)
             ══════════════════════════════════════════════════════════ */}
          {/* 1. Dashboard */}
          <Route
            path="admin"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />

          {/* 2. Medicine Management */}
          <Route
            path="admin/medicines"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminMedicinesPage />
              </RoleRoute>
            }
          />

          {/* 3. Categories */}
          <Route
            path="admin/categories"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminCategoriesPage />
              </RoleRoute>
            }
          />

          {/* 4. Supplier Management */}
          <Route
            path="admin/suppliers"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminSuppliersPage />
              </RoleRoute>
            }
          />

          {/* 5. Purchase Orders */}
          <Route
            path="admin/purchases"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminPurchasesPage />
              </RoleRoute>
            }
          />

          {/* 6. Stock Management */}
          <Route
            path="admin/stock"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/inventory"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminStockPage />
              </RoleRoute>
            }
          />

          {/* 6B. Wastage Management (Dedicated Module) */}
          <Route
            path="admin/wastage"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminWastagePage />
              </RoleRoute>
            }
          />

          {/* FEFO & Expiry Redirects into Integrated Medicine Management */}
          <Route path="admin/fefo" element={<Navigate to="/admin/medicines?tab=fefo-inventory" replace />} />
          <Route path="admin/expiry" element={<Navigate to="/admin/medicines?tab=expiry-risk" replace />} />

          {/* AI-Based Inventory Recommendations & Demand Forecasting */}
          <Route
            path="admin/ai-forecast"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AiForecastPage userRole="ADMIN" />
              </RoleRoute>
            }
          />

          {/* 8. Reports & Analytics */}
          <Route
            path="admin/reports"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminReportsPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/audit-logs"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminAuditLogsPage />
              </RoleRoute>
            }
          />

          {/* 9. User Management */}
          <Route
            path="admin/users"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminUsersPage />
              </RoleRoute>
            }
          />

          {/* 10. Notifications */}
          <Route
            path="admin/notifications"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminNotificationsPage />
              </RoleRoute>
            }
          />

          {/* 10b. SMTP Email Monitoring & Outbox */}
          <Route
            path="admin/email-monitoring"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminNotificationsPage />
              </RoleRoute>
            }
          />

          {/* 11. System Monitoring */}
          <Route
            path="admin/monitoring"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminMonitoringPage />
              </RoleRoute>
            }
          />

          {/* 12. Settings */}
          <Route
            path="admin/settings"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminSettingsPage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/setting"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminSettingsPage />
              </RoleRoute>
            }
          />

          {/* Admin Database Backup & Disaster Recovery */}
          <Route
            path="admin/backup-restore"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminBackupRestorePage />
              </RoleRoute>
            }
          />
          <Route
            path="admin/backups"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminBackupRestorePage />
              </RoleRoute>
            }
          />

          {/* Admin Feedback & Issue Resolution Management */}
          <Route
            path="admin/feedback"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <FeedbackHubPage role="ADMIN" />
              </RoleRoute>
            }
          />

          {/* Admin Profile */}
          <Route
            path="admin/profile"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <UserProfilePage />
              </RoleRoute>
            }
          />

          {/* ══════════════════════════════════════════════════════════
              2. PHARMACIST DASHBOARD & CLINICAL MODULES (10 MODULES)
             ══════════════════════════════════════════════════════════ */}
          {/* 1. Dashboard */}
          <Route
            path="pharmacist"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistDashboardPage />
              </RoleRoute>
            }
          />

          {/* 2. Medicines */}
          <Route
            path="pharmacist/medicines"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistMedicinesPage />
              </RoleRoute>
            }
          />

          {/* 3. Categories */}
          <Route
            path="pharmacist/categories"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistCategoriesPage />
              </RoleRoute>
            }
          />

          {/* 4. Stock Monitoring */}
          <Route
            path="pharmacist/stock"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="pharmacist/stock-check"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="pharmacist/stock-checking"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistStockPage />
              </RoleRoute>
            }
          />
          <Route
            path="pharmacist/batches"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistStockPage />
              </RoleRoute>
            }
          />

          {/* 4B. Wastage Management (Dedicated Module) */}
          <Route
            path="pharmacist/wastage"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistWastagePage />
              </RoleRoute>
            }
          />

          {/* FEFO & Expiry Redirects into Integrated Pharmacist Medicines */}
          <Route path="pharmacist/fefo" element={<Navigate to="/pharmacist/medicines?tab=fefo-allocation" replace />} />
          <Route path="pharmacist/expiry" element={<Navigate to="/pharmacist/medicines?tab=expiry-monitoring" replace />} />

          {/* AI-Based Inventory Recommendations & Reordering */}
          <Route
            path="pharmacist/ai-forecast"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <AiForecastPage userRole="PHARMACIST" />
              </RoleRoute>
            }
          />

          {/* 6. Purchase Orders */}
          <Route
            path="pharmacist/purchases"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistPurchasesPage />
              </RoleRoute>
            }
          />

          {/* 7. Suppliers */}
          <Route
            path="pharmacist/suppliers"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistSuppliersPage />
              </RoleRoute>
            }
          />

          {/* 8. Inventory Reports */}
          <Route
            path="pharmacist/reports"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistReportsPage />
              </RoleRoute>
            }
          />

          {/* 8B. Feedback & Support */}
          <Route
            path="pharmacist/feedback"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <FeedbackHubPage role="PHARMACIST" />
              </RoleRoute>
            }
          />

          {/* 9. Notifications */}
          <Route
            path="pharmacist/notifications"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <PharmacistNotificationsPage />
              </RoleRoute>
            }
          />

          {/* 10. My Profile */}
          <Route
            path="pharmacist/profile"
            element={
              <RoleRoute allowedRoles={[ROLES.PHARMACIST, ROLES.ADMIN]}>
                <UserProfilePage />
              </RoleRoute>
            }
          />

          {/* ══════════════════════════════════════════════════════════
              3. STAFF DASHBOARD & OPERATIONAL MODULES (8 MODULES)
             ══════════════════════════════════════════════════════════ */}
          {/* 1. Dashboard */}
          <Route
            path="staff"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffDashboardPage />
              </RoleRoute>
            }
          />

          {/* 2. View Medicines */}
          <Route
            path="staff/medicines"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffMedicinesPage />
              </RoleRoute>
            }
          />

          {/* 3. Search Medicines */}
          <Route
            path="staff/search"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffSearchPage />
              </RoleRoute>
            }
          />

          {/* 4. Stock Checking */}
          <Route
            path="staff/stock-check"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffStockCheckPage />
              </RoleRoute>
            }
          />
          <Route
            path="staff/stock-checking"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffStockCheckPage />
              </RoleRoute>
            }
          />
          <Route
            path="staff/stock"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffStockCheckPage />
              </RoleRoute>
            }
          />
          <Route
            path="staff/stockcheck"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffStockCheckPage />
              </RoleRoute>
            }
          />

          {/* 4B. Wastage Management (Dedicated Module) */}
          <Route
            path="staff/wastage"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffWastagePage />
              </RoleRoute>
            }
          />

          {/* FEFO & Expiry Redirects into Integrated Staff Medicines */}
          <Route path="staff/fefo" element={<Navigate to="/staff/medicines?tab=fefo-picking" replace />} />
          <Route path="staff/expiry" element={<Navigate to="/staff/medicines?tab=expiry-checking" replace />} />
          <Route path="staff/expiry-checking" element={<Navigate to="/staff/medicines?tab=expiry-checking" replace />} />

          {/* 5. Receive Medicines */}
          <Route
            path="staff/receive"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffReceivePage />
              </RoleRoute>
            }
          />

          {/* 6. Feedback & Support */}
          <Route
            path="staff/feedback"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <FeedbackHubPage role="STAFF" />
              </RoleRoute>
            }
          />

          {/* 7. Notifications */}
          <Route
            path="staff/notifications"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN]}>
                <StaffNotificationsPage />
              </RoleRoute>
            }
          />

          {/* 8. My Profile */}
          <Route
            path="staff/profile"
            element={
              <RoleRoute allowedRoles={[ROLES.STAFF, ROLES.PHARMACIST, ROLES.ADMIN, ROLES.SUPPLIER]}>
                <UserProfilePage />
              </RoleRoute>
            }
          />

          {/* ══════════════════════════════════════════════════════════
              4. SUPPLIER PORTAL (ISOLATED VENDOR DATA & FULFILLMENT)
             ══════════════════════════════════════════════════════════ */}
          <Route
            path="supplier"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="supplier/orders"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierOrdersPage />
              </RoleRoute>
            }
          />
          <Route
            path="supplier/medicines"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierMedicinesPage />
              </RoleRoute>
            }
          />
          <Route
            path="supplier/deliveries"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierDeliveriesPage />
              </RoleRoute>
            }
          />
          <Route
            path="supplier/history"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierHistoryPage />
              </RoleRoute>
            }
          />
          {/* Support & Feedback */}
          <Route
            path="supplier/feedback"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <FeedbackHubPage role="SUPPLIER" />
              </RoleRoute>
            }
          />

          <Route
            path="supplier/notifications"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierNotificationsPage />
              </RoleRoute>
            }
          />
          <Route
            path="supplier/profile"
            element={
              <RoleRoute allowedRoles={[ROLES.SUPPLIER, ROLES.ADMIN]}>
                <SupplierProfilePage />
              </RoleRoute>
            }
          />

          {/* Legacy navigation paths (preserved for backwards-compatibility) */}
          <Route path="medicines" element={<MedicinesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<RoleHomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}