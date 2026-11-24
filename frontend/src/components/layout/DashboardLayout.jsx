import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './DashboardLayout.css';

/**
 * Page-title map — keeps the topbar title in sync with the route.
 */
const PAGE_TITLES = {
  '/':                        'Dashboard',
  '/admin':                   'Dashboard',
  '/admin/medicines':         'Medicine Management',
  '/admin/categories':        'Categories',
  '/admin/suppliers':         'Supplier Management',
  '/admin/purchases':         'Purchase Orders',
  '/admin/stock':             'Stock Management',
  '/admin/inventory':         'Stock Management',
  '/admin/expiry':            'Expiry Tracking',
  '/admin/reports':           'Reports & Analytics',
  '/admin/audit-logs':        'Reports & Analytics',
  '/admin/users':             'User Management',
  '/admin/notifications':     'Notifications',
  '/admin/monitoring':        'System Monitoring',
  '/admin/backup-restore':    'Backup & Restore',
  '/admin/backups':           'Backup & Restore',
  '/admin/profile':           'My Profile',
  '/admin/ai-forecast':       'AI Demand Forecast',
  '/admin/wastage':           'Wastage Management',
  '/admin/feedback':          'Feedback Management',
  '/admin/settings':          'Settings',

  '/pharmacist':              'Dashboard',
  '/pharmacist/medicines':    'Medicines',
  '/pharmacist/categories':   'Categories',
  '/pharmacist/stock':        'Stock Monitoring',
  '/pharmacist/expiry':       'Expiry Tracking',
  '/pharmacist/purchases':    'Purchase Orders',
  '/pharmacist/suppliers':    'Suppliers',
  '/pharmacist/reports':      'Inventory Reports',
  '/pharmacist/notifications':'Notifications',
  '/pharmacist/profile':      'My Profile',
  '/pharmacist/stock-checking': 'Stock Monitoring',
  '/pharmacist/stock-check':  'Stock Monitoring',

  '/staff':                   'Dashboard',
  '/staff/medicines':         'View Medicines',
  '/staff/search':            'Search Medicines',
  '/staff/stock-check':       'Stock Checking',
  '/staff/stock-checking':    'Stock Checking',
  '/staff/stock':             'Stock Checking',
  '/staff/stockcheck':        'Stock Checking',
  '/staff/receive':           'Receive Medicines',
  '/staff/expiry':            'Expiry Checking',
  '/staff/expiry-checking':   'Expiry Checking',
  '/staff/notifications':     'Notifications',
  '/staff/profile':           'My Profile',

  '/supplier':                'Supplier Portal',
  '/supplier/orders':         'Purchase Orders',
  '/supplier/medicines':      'Contracted Medicines Catalog',
  '/supplier/deliveries':     'Update Delivery Status',
  '/supplier/history':        'Shipment & Order History',
  '/supplier/notifications':  'Supplier Notifications',
  '/supplier/profile':        'Supplier Profile & Settings',

  '/inventory':               'Inventory Management',
  '/medicines':               'Medicine Catalog',
  '/orders':                  'Purchase Orders',
  '/suppliers':               'Suppliers Directory',
  '/reports':                 'Reports & Analytics',
  '/settings':                'Settings',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'MediStock';

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-layout__main">
        <Topbar pageTitle={pageTitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
