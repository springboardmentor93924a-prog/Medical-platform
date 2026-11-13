import { Bell, Boxes, CalendarClock, ClipboardCheck, ClipboardList, FileBarChart, Gauge, History, LayoutDashboard, Pill, RotateCcw, Search, Settings, Sparkles, Tags, Trash2, Truck, Users } from "lucide-react";

// One sidebar per role. Each list holds only what that role may open, in that role's own words.
export const MENUS = {
  Admin: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/inventory", label: "Medicine Management", icon: Pill },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/suppliers", label: "Supplier Management", icon: Truck },
    { to: "/orders", label: "Purchase Orders", icon: ClipboardList },
    { to: "/stock", label: "Stock Management", icon: Boxes },
    { to: "/recommendations", label: "Recommendations", icon: Sparkles },
    { to: "/expiry", label: "Expiry Tracking", icon: CalendarClock },
    { to: "/wastage", label: "Wastage & Loss", icon: Trash2 },
    { to: "/returns", label: "Returns", icon: RotateCcw },
    { to: "/reports", label: "Reports & Analytics", icon: FileBarChart },
    { to: "/users", label: "User Management", icon: Users },
    { to: "/alerts", label: "Notifications", icon: Bell },
    { to: "/monitoring", label: "System Monitoring", icon: Gauge },
    { to: "/audit", label: "Audit Logs", icon: History },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
  Pharmacist: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/inventory", label: "Medicines", icon: Pill },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/stock", label: "Stock Monitoring", icon: Boxes },
    { to: "/recommendations", label: "Recommendations", icon: Sparkles },
    { to: "/expiry", label: "Expiry Tracking", icon: CalendarClock },
    { to: "/wastage", label: "Wastage & Loss", icon: Trash2 },
    { to: "/returns", label: "Returns", icon: RotateCcw },
    { to: "/orders", label: "Purchase Orders", icon: ClipboardList },
    { to: "/suppliers", label: "Suppliers", icon: Truck },
    { to: "/reports", label: "Inventory Reports", icon: FileBarChart },
    { to: "/alerts", label: "Notifications", icon: Bell },
  ],
  Staff: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/view-medicines", label: "View Medicines", icon: Pill },
    { to: "/search-medicines", label: "Search Medicines", icon: Search },
    { to: "/stock-checking", label: "Stock Checking", icon: ClipboardCheck },
    { to: "/expiry", label: "Expiry Checking", icon: CalendarClock },
    { to: "/alerts", label: "Notifications", icon: Bell },
  ],

  Supplier: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/orders", label: "Purchase Orders", icon: ClipboardList },
    { to: "/supplier-notifications", label: "Notifications", icon: Bell },
    { to: "/supplier-reports", label: "Reports", icon: FileBarChart },
  ],
};

// Every route and the roles allowed to open it, built from the menus above.
// App.jsx uses this to protect the pages, so a page missing from a role's menu is also closed to that role.
const rolesByPath = {};
Object.entries(MENUS).forEach(([role, items]) => items.forEach(({ to }) => { (rolesByPath[to] ??= []).push(role); }));
export const NAV = Object.entries(rolesByPath).map(([to, roles]) => ({ to, roles }));

// The page heading uses the same wording as the sidebar item for that role
export const titleFor = (role, path, fallback = "") => MENUS[role]?.find((m) => m.to === path)?.label ?? fallback;