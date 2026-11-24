import {
  IconDashboard,
  IconInventory,
  IconPill,
  IconOrders,
  IconSuppliers,
  IconReports,
  IconSettings,
  IconUsers,
  IconTruck,
  IconClipboard,
  IconShield,
  IconFileText,
  IconCheckCircle,
  IconHistory,
  IconTag,
  IconClock,
  IconBell,
  IconSearch,
  IconPackage,
  IconAlertTriangle,
  IconActivity,
  IconUser,
  IconGrid,
  IconBox,
  IconSparkles,
  IconChartTrend,
  IconMessageSquare,
  IconDatabase,
} from '../components/icons/Icons';

export const ROLES = {
  ADMIN: 'ADMIN',
  PHARMACIST: 'PHARMACIST',
  STAFF: 'STAFF',
  SUPPLIER: 'SUPPLIER',
};

/**
 * Mapping for backend database role IDs (from `users.role_id`).
 */
export const ROLE_ID_MAP = {
  1: ROLES.ADMIN,
  2: ROLES.PHARMACIST,
  3: ROLES.STAFF,
  4: ROLES.SUPPLIER,
};

/**
 * Normalizes any role input (number, case-varying string, DB role name)
 * to one of the canonical ROLES.
 */
export function normalizeRole(roleInput) {
  if (!roleInput && roleInput !== 0) return ROLES.STAFF;

  if (typeof roleInput === 'number') {
    return ROLE_ID_MAP[roleInput] || ROLES.STAFF;
  }

  const str = String(roleInput).trim().toUpperCase();

  // Strip Spring Security prefix if present
  const cleaned = str.replace(/^ROLE_/, '');

  if (cleaned.includes('ADMIN')) return ROLES.ADMIN;
  if (cleaned.includes('PHARM')) return ROLES.PHARMACIST;
  if (cleaned.includes('STAFF') || cleaned.includes('NURSE') || cleaned.includes('USER')) return ROLES.STAFF;
  if (cleaned.includes('SUPPL') || cleaned.includes('VENDOR')) return ROLES.SUPPLIER;

  // Numeric string fallback
  const num = parseInt(cleaned, 10);
  if (!isNaN(num) && ROLE_ID_MAP[num]) {
    return ROLE_ID_MAP[num];
  }

  return ROLES.STAFF;
}

/**
 * Metadata & presentation info for each role.
 */
export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    key: ROLES.ADMIN,
    name: 'Administrator',
    label: 'System Admin',
    homePath: '/admin',
    badgeVariant: 'danger',
    themeColor: '#ef4444',
    description: 'Full system control, users, inventory, logs & analytics',
  },
  [ROLES.PHARMACIST]: {
    key: ROLES.PHARMACIST,
    name: 'Pharmacist',
    label: 'Lead Pharmacist',
    homePath: '/pharmacist',
    badgeVariant: 'primary',
    themeColor: '#0d9488',
    description: 'Dispensing, batch management, receiving & stock checks',
  },
  [ROLES.STAFF]: {
    key: ROLES.STAFF,
    name: 'Staff',
    label: 'Hospital Staff',
    homePath: '/staff',
    badgeVariant: 'info',
    themeColor: '#3b82f6',
    description: 'Medicine requests, departmental stock viewing & assigned tasks',
  },
  [ROLES.SUPPLIER]: {
    key: ROLES.SUPPLIER,
    name: 'Supplier',
    label: 'Medical Supplier',
    homePath: '/supplier',
    badgeVariant: 'warning',
    themeColor: '#f59e0b',
    description: 'Vendor portal: Purchase orders, delivery status & supply catalog',
  },
};

/**
 * Verified demo accounts for development / testing.
 * The role is tied to the authenticated identity, NOT an arbitrary client dropdown.
 */
export const DEMO_ACCOUNTS = {
  'admin@medistock.com': {
    email: 'admin@medistock.com',
    fullName: 'Dr. Sarah Khan',
    role: ROLES.ADMIN,
    department: 'Hospital Administration',
  },
  'pharmacist@medistock.com': {
    email: 'pharmacist@medistock.com',
    fullName: 'Alex Rivera, PharmD',
    role: ROLES.PHARMACIST,
    department: 'Central Pharmacy',
  },
  'staff@medistock.com': {
    email: 'staff@medistock.com',
    fullName: 'Nurse Emily Watson',
    role: ROLES.STAFF,
    department: 'General Ward & ICU',
  },
  'supplier@medistock.com': {
    email: 'supplier@medistock.com',
    fullName: 'Apex Medical Supplies Ltd',
    role: ROLES.SUPPLIER,
    supplierId: 'SUP-1042',
    vendorCode: 'APEX-PHARMA',
  },
};

/**
 * Get dashboard home path for a given role.
 */
export function getRoleDashboardPath(role) {
  const norm = normalizeRole(role);
  return ROLE_CONFIG[norm]?.homePath || '/staff';
}

/**
 * Role-specific navigation items for the sidebar.
 * Order and labels match the specification exactly.
 */
export function getRoleNavItems(role) {
  const norm = normalizeRole(role);

  switch (norm) {
    /* ══════════════════════════════════════════════════════════════
       ADMIN SIDEBAR — Modules in exact order
       (FEFO & Expiry are fully integrated inside Medicine Management)
       ══════════════════════════════════════════════════════════════ */
    case ROLES.ADMIN:
      return [
        { to: '/admin',               label: 'Dashboard',           icon: IconDashboard, end: true },
        { to: '/admin/medicines',     label: 'Medicine Management', icon: IconPill },
        { to: '/admin/categories',    label: 'Categories',          icon: IconTag },
        { to: '/admin/suppliers',     label: 'Supplier Management', icon: IconSuppliers },
        { to: '/admin/purchases',     label: 'Purchase Orders',     icon: IconOrders },
        { to: '/admin/stock',         label: 'Stock Management',    icon: IconInventory },
        { to: '/admin/wastage',       label: 'Wastage Management',  icon: IconAlertTriangle },
        { to: '/admin/ai-forecast',   label: 'AI Demand Forecast',  icon: IconChartTrend },
        { to: '/admin/reports',       label: 'Reports & Analytics', icon: IconReports },
        { to: '/admin/audit-logs',    label: 'Activity & Audit Logs', icon: IconShield },
        { to: '/admin/feedback',      label: 'Feedback Management', icon: IconMessageSquare },
        { to: '/admin/users',         label: 'User Management',     icon: IconUsers },
        { to: '/admin/notifications', label: 'Notifications',       icon: IconBell },
        { to: '/admin/monitoring',    label: 'System Monitoring',   icon: IconActivity },
        { to: '/admin/backup-restore',label: 'Backup & Restore',    icon: IconDatabase },
        { to: '/admin/settings',      label: 'Settings',            icon: IconSettings },
      ];

    /* ══════════════════════════════════════════════════════════════
       PHARMACIST SIDEBAR — Modules in exact order
       (FEFO & Expiry are fully integrated inside Medicines)
       ══════════════════════════════════════════════════════════════ */
    case ROLES.PHARMACIST:
      return [
        { to: '/pharmacist',                label: 'Dashboard',         icon: IconDashboard, end: true },
        { to: '/pharmacist/medicines',      label: 'Medicines',         icon: IconPill },
        { to: '/pharmacist/categories',     label: 'Categories',        icon: IconGrid || IconTag },
        { to: '/pharmacist/stock',          label: 'Stock Monitoring',  icon: IconBox || IconInventory },
        { to: '/pharmacist/wastage',        label: 'Wastage Management', icon: IconAlertTriangle },
        { to: '/pharmacist/ai-forecast',    label: 'AI Recommendations', icon: IconSparkles },
        { to: '/pharmacist/purchases',      label: 'Purchase Orders',   icon: IconFileText || IconOrders },
        { to: '/pharmacist/suppliers',      label: 'Suppliers',         icon: IconUsers || IconSuppliers },
        { to: '/pharmacist/reports',        label: 'Inventory Reports', icon: IconReports },
        { to: '/pharmacist/feedback',       label: 'Feedback & Support', icon: IconMessageSquare },
        { to: '/pharmacist/notifications',  label: 'Notifications',     icon: IconBell, badgeKey: 'notifications' },
      ];

    /* ══════════════════════════════════════════════════════════════
       STAFF SIDEBAR — Modules in exact order
       (FEFO & Expiry are fully integrated inside View Medicines)
       ══════════════════════════════════════════════════════════════ */
    case ROLES.STAFF:
      return [
        { to: '/staff',                label: 'Dashboard',         icon: IconDashboard, end: true },
        { to: '/staff/medicines',      label: 'View Medicines',    icon: IconPill },
        { to: '/staff/search',         label: 'Search Medicines',  icon: IconSearch },
        { to: '/staff/stock-check',    label: 'Stock Checking',    icon: IconClipboard },
        { to: '/staff/wastage',        label: 'Wastage Management', icon: IconAlertTriangle },
        { to: '/staff/receive',        label: 'Receive Medicines', icon: IconPackage },
        { to: '/staff/feedback',       label: 'Feedback & Support', icon: IconMessageSquare },
        { to: '/staff/notifications',  label: 'Notifications',     icon: IconBell },
      ];

    /* ══════════════════════════════════════════════════════════════
       SUPPLIER SIDEBAR — Vendor portal (preserved)
       ══════════════════════════════════════════════════════════════ */
    case ROLES.SUPPLIER:
      return [
        { to: '/supplier',               label: 'Supplier Portal',     icon: IconDashboard, end: true },
        { to: '/supplier/orders',        label: 'Purchase Orders',     icon: IconOrders },
        { to: '/supplier/deliveries',    label: 'Update Deliveries',   icon: IconTruck },
        { to: '/supplier/history',       label: 'Delivery History',    icon: IconHistory },
        { to: '/supplier/feedback',      label: 'Support & Feedback',  icon: IconMessageSquare },
        { to: '/supplier/notifications', label: 'Notifications',       icon: IconBell, badgeKey: 'notifications' },
      ];

    default:
      return [
        { to: '/staff', label: 'Overview', icon: IconDashboard, end: true },
      ];
  }
}
