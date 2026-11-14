import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Tags,
  Truck,
  ShoppingCart,
  ArrowLeftRight,
  ClockAlert,
  Users,
  FileBarChart,
  ShieldCheck,
  Bell,
  UserCircle,
  Activity,
  Package,
  Settings,
  Search,
  PackageCheck,
  Trash2,
  Database,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Badge } from './Badge';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, role } = useAuth();
  const { unreadCount } = useNotification();

  const getNavLinks = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Medicine Management', path: '/medicines', icon: Pill },
          { name: 'Categories', path: '/categories', icon: Tags },
          { name: 'Supplier Management', path: '/suppliers', icon: Truck },
          { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
          { name: 'Stock Management', path: '/inventory/movements', icon: ArrowLeftRight },
          { name: 'Expiry Tracking', path: '/inventory/expiry', icon: ClockAlert },
          { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart },
          { name: 'User Management', path: '/users', icon: Users },
          { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
          { name: 'System Monitoring', path: '/system/monitoring', icon: Activity },
          { name: 'Settings', path: '/settings', icon: Settings },
          { name: 'Wastage & Loss Management', path: '/wastage', icon: Trash2 },
          { name: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck },
          { name: 'Backup & Restore', path: '/backup-restore', icon: Database },
          { name: 'Feedback Management', path: '/feedback', icon: MessageSquare },
          { name: 'FEFO Monitoring', path: '/fefo', icon: Layers },
        ];
      case 'PHARMACIST':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Medicines', path: '/medicines', icon: Pill },
          { name: 'Categories', path: '/categories', icon: Tags },
          { name: 'Stock Monitoring', path: '/inventory/movements', icon: ArrowLeftRight },
          { name: 'Expiry Tracking', path: '/inventory/expiry', icon: ClockAlert },
          { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
          { name: 'Suppliers', path: '/suppliers', icon: Truck },
          { name: 'Inventory Reports', path: '/reports', icon: FileBarChart },
          { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
          { name: 'My Profile', path: '/profile', icon: UserCircle },
          { name: 'Wastage & Loss Reporting', path: '/wastage', icon: Trash2 },
          { name: 'FEFO Management', path: '/fefo', icon: Layers },
          { name: 'Feedback', path: '/feedback', icon: MessageSquare },
        ];
      case 'STAFF':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'View Medicines', path: '/medicines', icon: Pill },
          { name: 'Search Medicines', path: '/medicines?focus=search', icon: Search },
          { name: 'Stock Checking', path: '/inventory/movements?mode=check', icon: ArrowLeftRight },
          { name: 'Receive Medicines', path: '/purchase-orders', icon: PackageCheck },
          { name: 'Expiry Checking', path: '/inventory/expiry', icon: ClockAlert },
          { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
          { name: 'My Profile', path: '/profile', icon: UserCircle },
          { name: 'Wastage Reporting', path: '/wastage', icon: Trash2 },
          { name: 'FEFO Assistance', path: '/fefo', icon: Layers },
          { name: 'Feedback', path: '/feedback', icon: MessageSquare },
        ];
      case 'SUPPLIER':
        return [
          { name: 'Supplier Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Supplied Medicines', path: '/medicines', icon: Package },
          { name: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingCart },
          { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount },
          { name: 'Business Profile', path: '/profile', icon: UserCircle },
          { name: 'Feedback', path: '/feedback', icon: MessageSquare },
        ];
      default:
        return [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              MediStock <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm bg-brand-500/20 text-brand-400 border border-brand-500/30">v1.0</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Inventory Intelligence</p>
          </div>
        </div>

        {/* Current Role Badge */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Logged In Role</p>
          <div className="flex items-center justify-between">
            <Badge variant={role || 'default'} size="sm">
              {role || 'USER'}
            </Badge>
            <span className="text-xs text-slate-400 truncate max-w-[110px] font-medium" title={user?.fullName}>
              {user?.fullName}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </div>
              {item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <NavLink
            to="/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/70 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-brand-700/60 text-brand-300 flex items-center justify-center font-bold text-xs ring-2 ring-brand-500/30">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </NavLink>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
