
import React, { useEffect, useMemo, useState } from 'react';
import {
    LayoutDashboard,
    Pill,
    Clock,
    Tags,
    Truck,
    Package,
    FileText,
    Receipt,
    History,
    Users,
    BarChart3,
    Bell,
    Activity,
    ChevronRight,
    UserCircle,
    Search,
    X,
    Command,
    ShieldCheck,
    Stethoscope,
    PanelLeftClose,
    PanelLeftOpen,
    ClipboardList,
    Boxes,
    ClipboardCheck,
    MessageSquare,
    Trash2,
    Database,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, onSelectTab, counts = {} }) => {
    const { user } = useAuth();

    // Existing role logic preserved
    const role = (user?.role || 'ADMIN').toUpperCase();

    const [collapsed, setCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [managementOpen, setManagementOpen] = useState(false);

    // Automatically open Management Center when one of its pages is active.
    useEffect(() => {
        const managementTabs = [
            'tasks',
            'audit',
            'feedback',
            'wastage',
            'backup',
        ];

        if (managementTabs.includes(activeTab)) {
            setManagementOpen(true);
        }
    }, [activeTab]);

    // ==============================
    // ADMIN NAVIGATION
    // ==============================

    const adminNavSections = [
        {
            title: 'Main',
            items: [
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'medicines', name: 'Medicines', icon: Pill },
                { id: 'expiry', name: 'Expiry', icon: Clock },
                { id: 'categories', name: 'Categories', icon: Tags },
            ],
        },
        {
            title: 'Operations',
            items: [
                { id: 'suppliers', name: 'Suppliers', icon: Truck },
                { id: 'inventory', name: 'Inventory', icon: Package },
                { id: 'purchase-orders', name: 'Purchase Orders', icon: FileText },
                { id: 'billing', name: 'Billing', icon: Receipt },
                { id: 'sales', name: 'Sales History', icon: History },
            ],
        },
        {
            title: 'Administration',
            items: [
                { id: 'users', name: 'Users & Roles', icon: Users },
                { id: 'reports', name: 'Reports', icon: BarChart3 },

                // Management Center with nested pages
                {
                    id: 'management-center',
                    name: 'Management Center',
                    icon: ShieldCheck,
                    children: [
                        {
                            id: 'tasks',
                            name: 'Task Management',
                            icon: ClipboardCheck,
                        },
                        {
                            id: 'audit',
                            name: 'Audit Trail',
                            icon: History,
                        },
                        {
                            id: 'feedback',
                            name: 'User Feedback',
                            icon: MessageSquare,
                        },
                        {
                            id: 'wastage',
                            name: 'Wastage Report',
                            icon: Trash2,
                        },
                        {
                            id: 'backup',
                            name: 'Backup & Restore',
                            icon: Database,
                        },
                    ],
                },
            ],
        },
    ];

    // ==============================
    // PHARMACIST NAVIGATION
    // ==============================

    const pharmacistNavSections = [
        {
            title: 'Inventory Management',
            items: [
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'medicines', name: 'Medicines', icon: Pill },
                { id: 'categories', name: 'Categories', icon: Tags },
                { id: 'inventory', name: 'Stock Monitoring', icon: Package },
                { id: 'expiry', name: 'Expiry Tracking', icon: Clock },
            ],
        },
        {
            title: 'Procurement',
            items: [
                { id: 'purchase-orders', name: 'Purchase Orders', icon: FileText },
                { id: 'suppliers', name: 'Suppliers', icon: Truck },
                { id: 'reports', name: 'Inventory Reports', icon: BarChart3 },
            ],
        },
        {
            title: 'Account',
            items: [
                { id: 'profile', name: 'My Profile', icon: UserCircle },
            ],
        },
    ];

    // ==============================
    // SUPPLIER NAVIGATION
    // ==============================

    const supplierNavSections = [
        {
            title: 'Overview',
            items: [
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
            ],
        },
        {
            title: 'Order Management',
            items: [
                { id: 'orders', name: 'Purchase Orders', icon: ClipboardList },
                { id: 'delivery', name: 'Deliveries', icon: Truck },
                { id: 'history', name: 'Order History', icon: History },
            ],
        },
        {
            title: 'Finance',
            items: [
                { id: 'billing', name: 'Billing & Payments', icon: Receipt },
            ],
        },
        {
            title: 'Account',
            items: [
                { id: 'profile', name: 'My Profile', icon: UserCircle },
            ],
        },
    ];

    // ==============================
    // STAFF NAVIGATION
    // ==============================

    const staffNavSections = [
        {
            title: 'Daily Operations',
            items: [
                { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
                { id: 'medicines', name: 'View Medicines', icon: Pill },
                { id: 'inventory', name: 'Stock Checking', icon: Boxes },
                { id: 'receive', name: 'Receive Medicines', icon: ClipboardCheck },
                { id: 'expiry', name: 'Expiry Checking', icon: Clock },
            ],
        },
        {
            title: 'Account',
            items: [
                { id: 'profile', name: 'My Profile', icon: UserCircle },
            ],
        },
    ];

    // ==============================
    // ROLE-BASED MENU SELECTION
    // ==============================

    let navSections = adminNavSections;

    if (role === 'PHARMACIST') navSections = pharmacistNavSections;
    if (role === 'SUPPLIER') navSections = supplierNavSections;
    if (role === 'STAFF') navSections = staffNavSections;

    // ==============================
    // SEARCH FILTERING
    // ==============================

    const visibleSections = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        if (!query) return navSections;

        return navSections
            .map((section) => ({
                ...section,

                items: section.items.flatMap((item) => {
                    if (item.children) {
                        const matchingChildren = item.children.filter(
                            (child) =>
                                child.name.toLowerCase().includes(query)
                        );

                        // If parent matches, show all its children.
                        if (item.name.toLowerCase().includes(query)) {
                            return [item];
                        }

                        // Otherwise show only matching nested pages.
                        return matchingChildren.length
                            ? [{ ...item, children: matchingChildren }]
                            : [];
                    }

                    return item.name.toLowerCase().includes(query)
                        ? [item]
                        : [];
                }),
            }))
            .filter((section) => section.items.length > 0);
    }, [navSections, searchTerm]);

    const isDarkRole = role === 'PHARMACIST';
    const isSupplierRole = role === 'SUPPLIER';

    // ==============================
    // NAVIGATION HANDLERS
    // ==============================

    const handleSelect = (id) => {
        onSelectTab(id);
        setSearchTerm('');
    };

    const handleManagementToggle = () => {
        if (collapsed) {
            setCollapsed(false);
            setManagementOpen(true);
            return;
        }

        setManagementOpen((current) => !current);
    };

    return (
        <aside
            className={`sticky top-0 z-30 flex h-screen shrink-0 flex-col overflow-hidden border-r border-blue-300/80 bg-slate-100 text-slate-700 shadow-[8px_0_30px_rgba(15,23,42,0.035)] transition-[width,background-color,border-color] duration-300 dark:border-slate-800 dark:bg-[#0b1220] dark:text-slate-300 ${
                collapsed ? 'w-[76px]' : 'w-64 xl:w-[276px]'
            }`}
        >

            {/* ================================= */}
            {/* BRAND HEADER */}
            {/* ================================= */}

            <div
                className={`relative flex h-[60px] shrink-0 items-center  dark:border-slate-800 ${
                    collapsed
                        ? 'justify-center px-2'
                        : 'justify-between px-6'
                }`}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

                <button
                    type="button"
                    onClick={() => handleSelect('dashboard')}
                    title="MediStock Dashboard"
                    className={`flex min-w-0 items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        collapsed ? 'justify-center' : ''
                    }`}
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-300 to-slate-100 shadow-lg shadow-blue-500/50">
                        <img
                            src="/images/medistock.png"
                            alt="MediStock"
                            className="h-full w-full object-contain p-1"
                            onError={(event) => {
                                event.currentTarget.style.display = 'none';
                                const fallback =
                                    event.currentTarget.nextElementSibling;

                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />

                        <span className="hidden h-full w-full items-center justify-center text-white">
                            <Activity size={23} />
                        </span>
                    </div>

                    {!collapsed && (
                        <div className="min-w-0">
                            <h1 className="truncate text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
                                Medi
                                <span className="text-blue-600 dark:text-blue-400">
                                    Stock
                                </span>
                            </h1>

                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                Medical inventory
                            </p>
                        </div>
                    )}
                </button>
            </div>

            {/* ================================= */}
            {/* WORKSPACE / ROLE INDICATOR */}
            {/* ================================= */}

            <div
                className={`shrink-0 ${
                    collapsed ? 'px-3 pt-5' : 'px-4 pt-2'
                }`}
            >
                <div
                    title={
                        collapsed
                            ? role === 'PHARMACIST'
                                ? 'Pharmacist workspace'
                                : role === 'SUPPLIER'
                                    ? 'Supplier workspace'
                                    : role === 'STAFF'
                                        ? 'Staff Workspace'
                                        : 'Administrator workspace'
                            : undefined
                    }
                    className={`flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/70 ${
                        collapsed
                            ? 'justify-center p-2'
                            : 'px-3 py-3'
                    }`}
                >
                    <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isDarkRole
                                ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300'
                                : isSupplierRole
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        }`}
                    >
                        {isDarkRole ? (
                            <Stethoscope size={18} />
                        ) : isSupplierRole ? (
                            <Truck size={18} />
                        ) : role === 'STAFF' ? (
                            <Users size={18} />
                        ) : (
                            <ShieldCheck size={18} />
                        )}
                    </div>

                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                Workspace
                            </p>

                            <p className="mt-0.5 truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                                {role === 'PHARMACIST'
                                    ? 'Pharmacist Portal'
                                    : role === 'SUPPLIER'
                                        ? 'Supplier Portal'
                                        : role === 'STAFF'
                                            ? 'Staff Workspace'
                                            : 'Admin Console'}
                            </p>
                        </div>
                    )}

                    {!collapsed && (
                        <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                                isDarkRole
                                    ? 'bg-teal-500'
                                    : isSupplierRole
                                        ? 'bg-emerald-500'
                                        : 'bg-blue-500'
                            }`}
                        />
                    )}
                </div>
            </div>

            {/* ================================= */}
            {/* NAVIGATION SEARCH */}
            {/* ================================= */}

            {!collapsed && (
                <div className="shrink-0 px-4 pt-3">
                    <label className="relative block">
                        <Search
                            size={15}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Find a page..."
                            aria-label="Search navigation"
                            className="w-full rounded-xl border border-slate-200/80 bg-slate-50 py-2.5 pl-9 pr-9 text-xs font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                        />

                        {searchTerm ? (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear navigation search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                            >
                                <X size={13} />
                            </button>
                        ) : (
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                                <Command size={10} />
                            </span>
                        )}
                    </label>
                </div>
            )}

            {/* ================================= */}
            {/* NAVIGATION */}
            {/* ================================= */}

            <nav
                aria-label="Main navigation"
                className={`min-h-0 flex-1 overflow-y-auto pb-4 ${
                    collapsed
                        ? 'px-2 pt-5'
                        : 'space-y-6 px-3 pt-5'
                }`}
            >
                {visibleSections.map((section) => (
                    <div key={section.title}>
                        {!collapsed && (
                            <div className="mb-2 flex items-center justify-between px-3">
                                <h2 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                    {section.title}
                                </h2>

                                <span className="text-[9px] font-semibold text-slate-300 dark:text-slate-600">
                                    {String(section.items.length).padStart(2, '0')}
                                </span>
                            </div>
                        )}

                        {collapsed && (
                            <div className="mx-auto mb-3 h-px w-8 bg-slate-200 dark:bg-slate-800" />
                        )}

                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const hasChildren = Boolean(item.children);

                                const childIsActive = hasChildren &&
                                    item.children.some(
                                        (child) => activeTab === child.id
                                    );

                                const isActive =
                                    activeTab === item.id || childIsActive;

                                const showChildren = hasChildren && (
                                    managementOpen ||
                                    Boolean(searchTerm.trim())
                                );

                                return (
                                    <li key={item.id}>
                                        {/* Main Navigation Item */}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (hasChildren) {
                                                    handleManagementToggle();
                                                } else {
                                                    handleSelect(item.id);
                                                }
                                            }}
                                            title={collapsed ? item.name : undefined}
                                            aria-expanded={
                                                hasChildren
                                                    ? showChildren
                                                    : undefined
                                            }
                                            aria-current={
                                                activeTab === item.id
                                                    ? 'page'
                                                    : undefined
                                            }
                                            className={`group relative flex w-full items-center rounded-xl text-[13px] font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0b1220] ${
                                                collapsed
                                                    ? 'justify-center px-0 py-3'
                                                    : 'gap-3 px-3 py-[10px]'
                                            } ${
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-inset ring-blue-100 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/20'
                                                    : 'text-slate-900 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:text-white'
                                            }`}
                                        >
                                            {isActive && (
                                                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-blue-600 dark:bg-blue-400" />
                                            )}

                                            <span
                                                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                                                        : 'text-slate-400 group-hover:bg-white group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:bg-slate-700 dark:group-hover:text-slate-100'
                                                }`}
                                            >
                                                <Icon
                                                    size={18}
                                                    strokeWidth={isActive ? 2.3 : 1.9}
                                                />
                                            </span>

                                            {!collapsed && (
                                                <>
                                                    <span className="min-w-0 flex-1 truncate text-left">
                                                        {item.name}
                                                    </span>

                                                    {hasChildren ? (
                                                        <ChevronRight
                                                            size={15}
                                                            className={`shrink-0 transition-transform duration-200 ${
                                                                showChildren
                                                                    ? 'rotate-90 text-blue-500 dark:text-blue-400'
                                                                    : 'text-slate-400'
                                                            }`}
                                                        />
                                                    ) : isActive ? (
                                                        <ChevronRight
                                                            size={15}
                                                            className="shrink-0 text-blue-500 dark:text-blue-400"
                                                        />
                                                    ) : null}
                                                </>
                                            )}
                                        </button>

                                        {/* MANAGEMENT CENTER SUBMENU */}
                                        {showChildren && !collapsed && (
                                            <ul className="ml-7 mt-1.5 space-y-1 border-l border-slate-400 pl-2 dark:border-blue-400">
                                                {item.children.map((child) => {
                                                    const ChildIcon = child.icon;
                                                    const childActive =
                                                        activeTab === child.id;

                                                    return (
                                                        <li key={child.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setManagementOpen(true);
                                                                    handleSelect(child.id);
                                                                }}
                                                                aria-current={
                                                                    childActive
                                                                        ? 'page'
                                                                        : undefined
                                                                }
                                                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                                                                    childActive
                                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                                                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                                                                }`}
                                                            >
                                                                <ChildIcon size={15} />

                                                                <span className="truncate">
                                                                    {child.name}
                                                                </span>

                                                                {childActive && (
                                                                    <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                                                )}
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}

                {/* EMPTY SEARCH RESULT */}
                {visibleSections.length === 0 && !collapsed && (
                    <div className="px-3 py-8 text-center">
                        <Search
                            size={22}
                            className="mx-auto text-slate-300 dark:text-slate-600"
                        />

                        <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                            No pages found
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                            Try another search term.
                        </p>

                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                            Clear search
                        </button>
                    </div>
                )}
            </nav>

            {/* ================================= */}
            {/* COMPACT BOTTOM TOOLBAR */}
            {/* ================================= */}

            <div className="shrink-0 border-t border-slate-200 bg-white  dark:border-slate-800 dark:bg-[#0b1220]">
                <div className="grid grid-cols-2 gap-3">

                    {/* NOTIFICATIONS */}
                    <button
                        type="button"
                        onClick={() => handleSelect('notifications')}
                        title="Notifications"
                        aria-label="Notifications"
                        aria-current={
                            activeTab === 'notifications'
                                ? 'page'
                                : undefined
                        }
                        className={`relative flex h-10 items-center justify-center rounded-xl transition-all ${
                            activeTab === 'notifications'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400'
                        }`}
                    >
                        <Bell size={19} />

                        {Number(counts.critical) > 0 && (
                            <>
                                <span className="absolute right-[calc(50%-17px)] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-rose-500 dark:border-[#0b1220]" />

                                <span className="absolute right-1.5 top-0.5 min-w-4 rounded-full bg-rose-500 px-1 py-0.5 text-[9px] font-extrabold text-white">
                                    {counts.critical > 99
                                        ? '99+'
                                        : counts.critical}
                                </span>
                            </>
                        )}
                    </button>

                    {/* COLLAPSE / EXPAND */}
                    <button
                        type="button"
                        onClick={() =>
                            setCollapsed((current) => !current)
                        }
                        title={
                            collapsed
                                ? 'Expand sidebar'
                                : 'Collapse sidebar'
                        }
                        aria-label={
                            collapsed
                                ? 'Expand sidebar'
                                : 'Collapse sidebar'
                        }
                        className="flex h-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                    >
                        {collapsed ? (
                            <PanelLeftOpen size={19} />
                        ) : (
                            <PanelLeftClose size={19} />
                        )}
                    </button>

                </div>
            </div>
        </aside>
    );
};
