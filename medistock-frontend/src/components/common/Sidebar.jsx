import React from 'react';
import { MediStockLogo } from './MediStockLogo';
import { useAuth } from '../../context/AuthContext'; // Adjust path if necessary
import { 
    LayoutDashboard, 
    Pill, 
    Snowflake, 
    Truck, 
    FileText, 
    ClipboardCheck, 
    UserCheck,
    ChevronRight,
    Shield,
    ShieldCheck, // New Icon for Admin
    X
} from 'lucide-react';

export const Sidebar = ({ 
    activeTab, 
    onSelectTab, 
    counts = {}, 
    mobileOpen = false, 
    onCloseMobile = () => {} 
}) => {
    const { user } = useAuth(); // Get the logged-in user

    const navItems = [
        {
            id: 'dashboard',
            label: 'Dashboard Overview',
            icon: LayoutDashboard,
            badge: null
        },
        {
            id: 'inventory',
            label: 'Formulary Inventory',
            icon: Pill,
            badge: counts.total || null,
            badgeColor: 'bg-emerald-100 text-emerald-800'
        },
        {
            id: 'expiry',
            label: 'Cold-Chain & Expiry',
            icon: Snowflake,
            badge: counts.critical || null,
            badgeColor: 'bg-amber-100 text-amber-800'
        },
        {
            id: 'suppliers',
            label: 'Distributor Network',
            icon: Truck,
            badge: counts.suppliers || null,
            badgeColor: 'bg-slate-100 text-slate-700'
        },
        {
            id: 'reports',
            label: 'Reports & Analytics',
            icon: FileText,
            badge: null
        },
        {
            id: 'audit',
            label: 'Compliance Audit Logs',
            icon: ClipboardCheck,
            badge: null
        },
        {
            id: 'profile',
            label: 'User Credentials',
            icon: UserCheck,
            badge: null
        }
    ];

    // Conditionally add Admin Tab
    const isAdmin = user?.role === 'Admin' || user?.role === 'ADMIN';
    if (isAdmin) {
        navItems.push({
            id: 'admin',
            label: 'Admin Control Panel',
            icon: ShieldCheck,
            badge: null
        });
    }

    const handleItemClick = (id) => {
        onSelectTab(id);
        if (onCloseMobile) {
            onCloseMobile();
        }
    };

    const sidebarContent = (isMobile = false) => (
        <div className="flex flex-col justify-between h-full">
            <div>
                {/* Top Brand Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <MediStockLogo size="md" />
                    {isMobile && (
                        <button
                            onClick={onCloseMobile}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="Close navigation menu"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="p-3 space-y-1 mt-1 overflow-y-auto max-h-[calc(100vh-180px)]">
                    <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Clinical Modules
                    </div>
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleItemClick(item.id)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <Icon size={17} className={`shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className="truncate">{item.label}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {item.badge !== null && item.badge !== undefined && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                                            {item.badge}
                                        </span>
                                    )}
                                    {isActive && <ChevronRight size={13} className="text-emerald-600" />}
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom System Health Badge */}
            <div className="p-3.5 m-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 mb-1">
                    <Shield size={14} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800">GxP Standard Active</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                    Telemetry synchronized. Ready for hospital data entry.
                </p>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sticky Sidebar (Visible >= lg: 1024px) */}
            <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col justify-between h-screen sticky top-0 shadow-xs z-20">
                {sidebarContent(false)}
            </aside>

            {/* Mobile Slide-Over Drawer & Overlay (Visible < lg when mobileOpen is true) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300"
                        onClick={onCloseMobile}
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between h-full z-10 transform transition-transform duration-300 ease-in-out">
                        {sidebarContent(true)}
                    </aside>
                </div>
            )}
        </>
    );
};