
import React, { useState, useEffect, useCallback } from 'react';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    X,
    RefreshCw,
    Search,
    Package,
    CalendarClock,
    ShoppingCart,
    ArrowUpRight,
    Inbox,
    ShieldCheck,
    ChevronRight,
    Activity,
    Filter,
    ExternalLink,
} from 'lucide-react';

import { adminService } from '../../services/adminService';

export const NotificationsView = ({ onNavigate }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');

    const fetchNotifs = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        }

        try {
            const data = await adminService.getNotifications();
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifs();
    }, [fetchNotifs]);

    const handleClear = async (id) => {
        // Preserve existing optimistic UI behavior.
        setNotifications((prev) => prev.filter((n) => n.id !== id));

        try {
            await adminService.clearNotification(id);
        } catch (err) {
            console.error(err);
            fetchNotifs();
        }
    };

    const getNotificationCategory = (notif) => {
        const type = String(notif?.type || '').toUpperCase();
        const text = [
            notif?.title,
            notif?.message,
            notif?.source,
            notif?.category,
            notif?.entityType,
            notif?.relatedEntity,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (
            type === 'CRITICAL' ||
            text.includes('out of stock') ||
            text.includes('critical stock') ||
            text.includes('stockout')
        ) {
            return 'CRITICAL';
        }

        if (
            text.includes('expir') ||
            text.includes('shelf life') ||
            text.includes('expiry')
        ) {
            return 'EXPIRY';
        }

        if (
            text.includes('purchase') ||
            text.includes('order') ||
            text.includes('approved') ||
            text.includes('rejected') ||
            text.includes('procurement')
        ) {
            return 'PURCHASE';
        }

        if (
            type === 'WARNING' ||
            text.includes('low stock') ||
            text.includes('restock') ||
            text.includes('reorder')
        ) {
            return 'WARNING';
        }

        if (
            type === 'SUCCESS' ||
            type === 'INFO' ||
            type === 'INFORMATION'
        ) {
            return 'INFO';
        }

        return 'OTHER';
    };

    const getCategoryConfig = (category) => {
        const configs = {
            CRITICAL: {
                label: 'Critical alert',
                icon: XCircle,
                iconColor: 'text-rose-600 dark:text-rose-400',
                iconBg: 'bg-rose-50 dark:bg-rose-950/50',
                border: 'border-l-rose-500',
                badge:
                    'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300',
                heading: 'Critical',
            },
            WARNING: {
                label: 'Low stock',
                icon: AlertTriangle,
                iconColor: 'text-amber-600 dark:text-amber-400',
                iconBg: 'bg-amber-50 dark:bg-amber-950/50',
                border: 'border-l-amber-500',
                badge:
                    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
                heading: 'Low stock',
            },
            EXPIRY: {
                label: 'Expiry alert',
                icon: CalendarClock,
                iconColor: 'text-orange-600 dark:text-orange-400',
                iconBg: 'bg-orange-50 dark:bg-orange-950/50',
                border: 'border-l-orange-500',
                badge:
                    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300',
                heading: 'Expiry',
            },
            PURCHASE: {
                label: 'Purchase order',
                icon: ShoppingCart,
                iconColor: 'text-violet-600 dark:text-violet-400',
                iconBg: 'bg-violet-50 dark:bg-violet-950/50',
                border: 'border-l-violet-500',
                badge:
                    'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300',
                heading: 'Purchase',
            },
            INFO: {
                label: 'Information',
                icon: CheckCircle,
                iconColor: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/50',
                border: 'border-l-emerald-500',
                badge:
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300',
                heading: 'Information',
            },
            OTHER: {
                label: 'System notification',
                icon: Bell,
                iconColor: 'text-blue-600 dark:text-blue-400',
                iconBg: 'bg-blue-50 dark:bg-blue-950/50',
                border: 'border-l-blue-500',
                badge:
                    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
                heading: 'System',
            },
        };

        return configs[category] || configs.OTHER;
    };

    const getDestination = (notif) => {
        // Respect an explicit destination when one is provided by the API.
        const explicitUrl = notif?.actionUrl || notif?.link || notif?.url;

        if (
            typeof explicitUrl === 'string' &&
            explicitUrl.trim() &&
            !explicitUrl.startsWith('javascript:')
        ) {
            return { url: explicitUrl.trim(), tab: null };
        }

        // Otherwise infer the existing app section from notification details.
        const text = [
            notif?.title,
            notif?.message,
            notif?.source,
            notif?.category,
            notif?.entityType,
            notif?.relatedEntity,
            notif?.type,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (
            text.includes('expir') ||
            text.includes('shelf life')
        ) {
            return { url: null, tab: 'expiry' };
        }

        if (
            text.includes('purchase') ||
            text.includes('order') ||
            text.includes('approved') ||
            text.includes('rejected') ||
            text.includes('procurement')
        ) {
            return { url: null, tab: 'purchase-orders' };
        }

        if (
            text.includes('stock') ||
            text.includes('restock') ||
            text.includes('reorder') ||
            text.includes('medicine') ||
            text.includes('inventory')
        ) {
            return { url: null, tab: 'inventory' };
        }

        // Use an explicitly provided source page if the notification has one.
        const sourcePage = notif?.sourcePage || notif?.page;

        if (typeof sourcePage === 'string' && sourcePage.trim()) {
            return { url: null, tab: sourcePage.trim() };
        }

        return null;
    };

    const handleNotificationClick = (notif) => {
        const destination = getDestination(notif);

        if (!destination) return;

        if (destination.url) {
            // External or explicitly supplied application URL.
            window.location.assign(destination.url);
            return;
        }

        // AppLayout should supply this callback to switch its active section.
        if (typeof onNavigate === 'function') {
            onNavigate(destination.tab);
        }
    };

    const filteredNotifications = notifications.filter((notif) => {
        const category = getNotificationCategory(notif);
        const matchesFilter =
            activeFilter === 'ALL' || category === activeFilter;

        const query = searchTerm.trim().toLowerCase();
        const matchesSearch =
            !query ||
            [
                notif?.title,
                notif?.message,
                notif?.type,
                notif?.time,
            ]
                .filter(Boolean)
                .some((value) =>
                    String(value).toLowerCase().includes(query)
                );

        return matchesFilter && matchesSearch;
    });

    const criticalCount = notifications.filter(
        (n) => getNotificationCategory(n) === 'CRITICAL'
    ).length;

    const lowStockCount = notifications.filter(
        (n) => getNotificationCategory(n) === 'WARNING'
    ).length;

    const expiryCount = notifications.filter(
        (n) => getNotificationCategory(n) === 'EXPIRY'
    ).length;

    const purchaseCount = notifications.filter(
        (n) => getNotificationCategory(n) === 'PURCHASE'
    ).length;

    const filters = [
        { value: 'ALL', label: 'All alerts', count: notifications.length },
        { value: 'CRITICAL', label: 'Critical', count: criticalCount },
        { value: 'WARNING', label: 'Low stock', count: lowStockCount },
        { value: 'EXPIRY', label: 'Expiry', count: expiryCount },
        { value: 'PURCHASE', label: 'Purchases', count: purchaseCount },
    ];

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
                    <div className="h-4 w-80 max-w-full rounded bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                        />
                    ))}
                </div>

                <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-7 pb-10 text-slate-900 dark:text-slate-100">

            {/* Header */}
            <section className="relative overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 p-6 text-slate-800 shadow-lg shadow-blue-900/5 transition-colors duration-300 dark:border-blue-800/40 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 dark:text-white dark:shadow-blue-950/20 sm:p-8">

    {/* Decorative Elements */}
    <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[35px] border-blue-500/10 dark:border-white/5" />

    <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-indigo-300/30 blur-3xl dark:bg-blue-500/10" />

    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <div className="mb-3 flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-800 backdrop-blur dark:border-blue-300/20 dark:bg-white/10 dark:text-blue-100">
                <Activity size={14} />
                MediStock Alerts
            </div>

            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Notifications Center

                {notifications.length > 0 && (
                    <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-rose-500 px-2 py-1 text-xs font-bold text-white shadow-sm shadow-rose-500/20">
                        {notifications.length}
                    </span>
                )}
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Stay informed about stock levels, medicine expiry,
                purchase orders and important system updates.
            </p>
        </div>

        <button
            type="button"
            onClick={() => fetchNotifs(true)}
            disabled={refreshing}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white/80 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:border-white/25 dark:hover:bg-white/15"
        >
            <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
            />
            {refreshing ? 'Refreshing...' : 'Refresh alerts'}
        </button>
    </div>

    <div className="relative mt-6 flex items-center gap-2 border-t border-blue-200/80 pt-4 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
        <ShieldCheck
            size={15}
            className="text-emerald-600 dark:text-emerald-400"
        />
        Inventory alerts and operational notifications
    </div>
</section>

            {/* Summary cards */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                {[
                    {
                        label: 'Critical alerts',
                        count: criticalCount,
                        filter: 'CRITICAL',
                        icon: XCircle,
                        iconColor: 'text-rose-600 dark:text-rose-400',
                        iconBg: 'bg-rose-50 dark:bg-rose-950/50',
                    },
                    {
                        label: 'Low stock',
                        count: lowStockCount,
                        filter: 'WARNING',
                        icon: AlertTriangle,
                        iconColor: 'text-amber-600 dark:text-amber-400',
                        iconBg: 'bg-amber-50 dark:bg-amber-950/50',
                    },
                    {
                        label: 'Expiry alerts',
                        count: expiryCount,
                        filter: 'EXPIRY',
                        icon: CalendarClock,
                        iconColor: 'text-orange-600 dark:text-orange-400',
                        iconBg: 'bg-orange-50 dark:bg-orange-950/50',
                    },
                    {
                        label: 'Purchase updates',
                        count: purchaseCount,
                        filter: 'PURCHASE',
                        icon: ShoppingCart,
                        iconColor: 'text-violet-600 dark:text-violet-400',
                        iconBg: 'bg-violet-50 dark:bg-violet-950/50',
                    },
                ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFilter === item.filter;

                    return (
                        <button
                            key={item.filter}
                            type="button"
                            onClick={() =>
                                setActiveFilter(isActive ? 'ALL' : item.filter)
                            }
                            className={`group rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 sm:p-5 ${
                                isActive
                                    ? 'border-emerald-500 ring-2 ring-emerald-500/10 dark:border-emerald-600'
                                    : 'border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                                    <Icon size={20} className={item.iconColor} />
                                </div>
                                <ChevronRight
                                    size={16}
                                    className="text-slate-300 transition group-hover:translate-x-0.5 dark:text-slate-600"
                                />
                            </div>

                            <p className="mt-4 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
                                {item.count}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                {item.label}
                            </p>
                        </button>
                    );
                })}
            </section>

            {/* Filters and search */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Alert activity
                            </h2>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                {filteredNotifications.length} of {notifications.length} notifications
                            </p>
                        </div>

                        <div className="relative w-full sm:max-w-xs">
                            <Search
                                size={17}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search notifications..."
                                aria-label="Search notifications"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Filter size={15} className="shrink-0 text-slate-400" />

                        {filters.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setActiveFilter(filter.value)}
                                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                                    activeFilter === filter.value
                                        ? 'border-slate-900 bg-slate-900 text-white dark:border-emerald-500 dark:bg-emerald-600 dark:text-white'
                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                {filter.label}
                                <span
                                    className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                        activeFilter === filter.value
                                            ? 'bg-white/15 text-white'
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                    }`}
                                >
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notification list */}
                {filteredNotifications.length === 0 ? (
                    <div className="border-t border-slate-100 px-5 py-14 text-center dark:border-slate-800 sm:px-8">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
                            {notifications.length === 0 ? (
                                <CheckCircle size={30} className="text-emerald-600 dark:text-emerald-400" />
                            ) : (
                                <Inbox size={30} className="text-slate-400 dark:text-slate-500" />
                            )}
                        </div>

                        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                            {notifications.length === 0
                                ? 'All caught up!'
                                : 'No matching notifications'}
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {notifications.length === 0
                                ? 'There are no active alerts to display right now.'
                                : 'Try another category or change your search to find the notification you need.'}
                        </p>

                        {notifications.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveFilter('ALL');
                                    setSearchTerm('');
                                }}
                                className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                        {filteredNotifications.map((notif) => {
                            const category = getNotificationCategory(notif);
                            const config = getCategoryConfig(category);
                            const Icon = config.icon;
                            const destination = getDestination(notif);
                            const isNavigable =
                                !!destination &&
                                (!!destination.url ||
                                    typeof onNavigate === 'function');

                            return (
                                <article
                                    key={notif.id}
                                    className={`group border-l-[3px] ${config.border} p-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 sm:p-5`}
                                >
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.iconBg}`}>
                                            <Icon size={21} className={config.iconColor} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">
                                                    {notif.title || 'Notification'}
                                                </h3>

                                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.badge}`}>
                                                    {config.label}
                                                </span>
                                            </div>

                                            <p className="mt-1.5 break-words text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                {notif.message || 'No additional details available.'}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                                                    <Clock size={13} />
                                                    {notif.time || 'Time unavailable'}
                                                </span>

                                                {isNavigable && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNotificationClick(notif)}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                                                    >
                                                        View related page
                                                        <ArrowUpRight size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleClear(notif.id)}
                                            title="Dismiss notification"
                                            aria-label={`Dismiss ${notif.title || 'notification'}`}
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                                        >
                                            <X size={17} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <p className="flex items-start gap-2 px-1 text-xs leading-5 text-slate-400 dark:text-slate-500">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                Dismissing an alert removes it through the existing notification service. It does not change the associated medicine or purchase order.
            </p>
        </div>
    );
};