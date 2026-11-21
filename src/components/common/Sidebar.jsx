import React from 'react';
import { 
    LayoutDashboard, Pill, Clock, Tags, 
    Truck, Package, FileText, Receipt, History, Users, 
    BarChart3, Bell, Activity,
    ChevronRight, UserCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // IMPORT AUTH

export const Sidebar = ({ activeTab, onSelectTab, counts = {} }) => {
    const { user } = useAuth();
    console.log("CURRENT USER ROLE:", user?.role);
    // Convert to uppercase so "Pharmacist" and "PHARMACIST" both work
const role = (user?.role || 'ADMIN').toUpperCase();  // Default to admin if undefined for safety

    // 1. ADMIN MENU (Keep exactly as you had it)
    const adminNavSections = [
        {
            title: "Main",
            items: [
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'medicines', name: 'Medicines', icon: Pill },
                { id: 'expiry', name: 'Expiry', icon: Clock },
                { id: 'categories', name: 'Categories', icon: Tags },
            ]
        },
        {
            title: "Operations",
            items: [
                { id: 'suppliers', name: 'Suppliers', icon: Truck },
                { id: 'inventory', name: 'Inventory', icon: Package },
                { id: 'purchase-orders', name: 'Purchase Orders', icon: FileText },
                { id: 'billing', name: 'Billing / POS', icon: Receipt },
                { id: 'sales', name: 'Sales History', icon: History },
            ]
        },
        {
            title: "Administration",
            items: [
                { id: 'users', name: 'Users & Roles', icon: Users },
                { id: 'reports', name: 'Reports', icon: BarChart3 },
            ]
        }
    ];

    // 2. PHARMACIST MENU (Added from your document)
    const pharmacistNavSections = [
        {
            title: "Inventory Management",
            items: [
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'medicines', name: 'Medicines', icon: Pill },
                { id: 'categories', name: 'Categories', icon: Tags },
                { id: 'inventory', name: 'Stock Monitoring', icon: Package },
                { id: 'expiry', name: 'Expiry Tracking', icon: Clock },
            ]
        },
        {
            title: "Procurement",
            items: [
                { id: 'purchase-orders', name: 'Purchase Orders', icon: FileText },
                { id: 'suppliers', name: 'Suppliers', icon: Truck },
                { id: 'reports', name: 'Inventory Reports', icon: BarChart3 },
            ]
        },
        {
            title: "Account",
            items: [
                { id: 'profile', name: 'My Profile', icon: UserCircle },
            ]
        }
    ];

    // 3. CHOOSE MENU BASED ON ROLE
    const navSections = role === 'PHARMACIST' ? pharmacistNavSections : adminNavSections;

    return (
        <aside className="w-64 h-screen sticky top-0 bg-slate-200 text-slate-600 flex flex-col shrink-0 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
            
            {/* Logo Area */}
            <div className="h-20 flex items-center px-6 border-b border-slate-100">
                <img 
                    src="images/medistock_logo.png" 
                    alt="MediStock" 
                    className="h-12 object-contain" 
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
                <div className="hidden items-center gap-2 text-slate-900 font-bold text-xl tracking-tight">
                    <Activity className="text-blue-600" size={24} />
                    MEDISTOCK
                </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar space-y-6">
                {navSections.map((section, idx) => (
                    <div key={idx}>
                        <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                            {section.title}
                        </h3>
                        
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <li key={item.id}>
                                        <button
                                            onClick={() => onSelectTab(item.id)}
                                            className={`w-full group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                isActive 
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                                                    : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900' 
                                            }`}
                                        >
                                            <item.icon 
                                                className={`mr-3 transition-colors ${
                                                    isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                                                }`} 
                                                size={18} 
                                            />
                                            <span className="flex-1 text-left">{item.name}</span>
                                            
                                            {isActive && (
                                                <ChevronRight size={14} className="text-blue-400" />
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Notification & Footer Area */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                 <button
                    onClick={() => onSelectTab('notifications')}
                    className={`w-full group flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeTab === 'notifications' 
                            ? 'bg-white shadow-sm border border-slate-200 text-blue-700' 
                            : 'hover:bg-white hover:shadow-sm text-slate-600 hover:text-slate-900 border border-transparent' 
                    }`}
                >
                    <Bell 
                        className={`mr-3 ${
                            activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`} 
                        size={18} 
                    />
                    <span className="flex-1 text-left">Notifications</span>
                    
                    {counts.critical > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ring-2 ring-white">
                            {counts.critical}
                        </span>
                    )}
                </button>
            </div>
        </aside>
    );
};