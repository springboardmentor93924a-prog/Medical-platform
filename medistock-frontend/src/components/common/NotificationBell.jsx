
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    X,
    Package,
    CalendarClock,
    ShoppingCart,
    Check,
    RefreshCw,
    ArrowUpRight,
    ShieldCheck,
    Search,
    ExternalLink,
    Activity
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export const NotificationBell = ({ onNavigate }) => {
    const { user } = useAuth();

    const role = (user?.role || 'ADMIN').toUpperCase();
    const isPharmacist = role === 'PHARMACIST';

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const dropdownRef = useRef(null);
    const isMountedRef = useRef(true);

    // Fetch notifications using the existing service.
    const fetchNotifs = async (showLoader = false) => {
        if (showLoader && isMountedRef.current) {
            setRefreshing(true);
        }

        try {
            const data = await adminService.getNotifications();

            if (isMountedRef.current) {
                setNotifications(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        setLoading(true);
        fetchNotifs();

        const interval = setInterval(() => fetchNotifs(), 60000);

        return () => {
            isMountedRef.current = false;
            clearInterval(interval);
        };
    }, []);

    // Close the dropdown when clicking outside it.
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    // Identify the notification category without changing backend data.
    const getCategory = (notif) => {
        const text = [
            notif?.title,
            notif?.message,
            notif?.category,
            notif?.entityType,
            notif?.sourcePage,
            notif?.type
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        if (
            /expir|expired|expiry|near expiration/.test(text)
        ) {
            return 'EXPIRY';
        }

        if (
            /purchase|purchase order|order approved|order rejected|procurement|supplier order|rejected order|approved order/.test(text)
        ) {
            return 'PURCHASE';
        }

        if (
            /low stock|out of stock|stock alert|restock|reorder|inventory/.test(text)
        ) {
            return 'STOCK';
        }

        if (
            String(notif?.type || '').toUpperCase() === 'CRITICAL'
        ) {
            return 'CRITICAL';
        }

        if (
            String(notif?.type || '').toUpperCase() === 'WARNING'
        ) {
            return 'WARNING';
        }

        return 'GENERAL';
    };

    const getCategoryStyle = (category) => {
        const styles = {
            STOCK: {
                icon: Package,
                label: 'Low stock',
                iconClass: 'text-amber-600 dark:text-amber-400',
                iconBg: 'bg-amber-100 dark:bg-amber-500/15',
                badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
            },
            EXPIRY: {
                icon: CalendarClock,
                label: 'Expiry alert',
                iconClass: 'text-rose-600 dark:text-rose-400',
                iconBg: 'bg-rose-100 dark:bg-rose-500/15',
                badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            },
            PURCHASE: {
                icon: ShoppingCart,
                label: 'Purchase',
                iconClass: 'text-blue-600 dark:text-blue-400',
                iconBg: 'bg-blue-100 dark:bg-blue-500/15',
                badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
            },
            CRITICAL: {
                icon: XCircle,
                label: 'Critical',
                iconClass: 'text-rose-600 dark:text-rose-400',
                iconBg: 'bg-rose-100 dark:bg-rose-500/15',
                badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            },
            WARNING: {
                icon: AlertTriangle,
                label: 'Warning',
                iconClass: 'text-amber-600 dark:text-amber-400',
                iconBg: 'bg-amber-100 dark:bg-amber-500/15',
                badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
            },
            GENERAL: {
                icon: CheckCircle,
                label: 'Update',
                iconClass: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-100 dark:bg-emerald-500/15',
                badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
            }
        };

        return styles[category] || styles.GENERAL;
    };

    // Map notifications to the existing AppLayout tab IDs.
    const getDestination = (notif) => {
        const explicitUrl =
            notif?.actionUrl ||
            notif?.link ||
            notif?.url;

        if (explicitUrl) {
            return { url: explicitUrl };
        }

        const source = String(
            notif?.sourcePage ||
            notif?.page ||
            notif?.destination ||
            ''
        ).toLowerCase();

        // Preserve an explicitly supplied page destination.
        if (source) {
            if (/expiry|expired/.test(source)) {
                return { tab: 'expiry' };
            }

            if (/purchase|order|procurement/.test(source)) {
                return { tab: 'purchase-orders' };
            }

            if (/inventory|stock|medicine/.test(source)) {
                return { tab: 'inventory' };
            }

            if (/supplier/.test(source)) {
                return { tab: 'suppliers' };
            }

            if (/notification/.test(source)) {
                return { tab: 'notifications' };
            }
        }

        const category = getCategory(notif);

        if (category === 'EXPIRY') {
            return { tab: 'expiry' };
        }

        if (category === 'PURCHASE') {
            return { tab: 'purchase-orders' };
        }

        if (category === 'STOCK') {
            return { tab: 'inventory' };
        }

        return null;
    };

    const handleNotificationClick = (notif) => {
        const destination = getDestination(notif);

        setIsOpen(false);

        if (destination?.tab && typeof onNavigate === 'function') {
            onNavigate(destination.tab);
            return;
        }

        if (destination?.url) {
            try {
                const parsedUrl = new URL(
                    destination.url,
                    window.location.origin
                );

                if (
                    parsedUrl.protocol === 'http:' ||
                    parsedUrl.protocol === 'https:'
                ) {
                    window.location.assign(parsedUrl.href);
                }
            } catch (err) {
                console.error('Invalid notification destination', err);
            }

            return;
        }

        // No destination is inferred for unrelated notifications.
        console.info(
            'No destination is configured for this notification:',
            notif?.id
        );
    };

    // Preserve the existing optimistic dismissal and rollback behavior.
    const handleClear = async (e, id) => {
        e.stopPropagation();

        const previousNotifs = [...notifications];

        setNotifications((prev) => prev.filter((n) => n.id !== id));

        try {
            await adminService.clearNotification(id);
        } catch (err) {
            console.error('Failed to clear notification', err);

            if (isMountedRef.current) {
                setNotifications(previousNotifs);
            }
        }
    };

    const categoryCounts = useMemo(() => {
        return notifications.reduce(
            (counts, notif) => {
                counts.ALL += 1;
                counts[getCategory(notif)] =
                    (counts[getCategory(notif)] || 0) + 1;
                return counts;
            },
            { ALL: 0, STOCK: 0, EXPIRY: 0, PURCHASE: 0 }
        );
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        return notifications.filter((notif) => {
            const category = getCategory(notif);

            const matchesFilter =
                filter === 'ALL' ||
                (filter === 'STOCK' && category === 'STOCK') ||
                (filter === 'EXPIRY' && category === 'EXPIRY') ||
                (filter === 'PURCHASE' && category === 'PURCHASE');

            const query = searchTerm.trim().toLowerCase();

            const matchesSearch =
                !query ||
                [notif?.title, notif?.message, notif?.time]
                    .filter(Boolean)
                    .some((value) =>
                        String(value).toLowerCase().includes(query)
                    );

            return matchesFilter && matchesSearch;
        });
    }, [notifications, filter, searchTerm]);

    const tabs = [
        { id: 'ALL', label: 'All', count: categoryCounts.ALL },
        { id: 'STOCK', label: 'Stock', count: categoryCounts.STOCK },
        { id: 'EXPIRY', label: 'Expiry', count: categoryCounts.EXPIRY },
        {
            id: 'PURCHASE',
            label: 'Orders',
            count: categoryCounts.PURCHASE
        }
    ];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification bell */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={`Notifications, ${notifications.length} active alerts`}
                aria-expanded={isOpen}
                className={`
                    relative flex h-11 w-11 items-center justify-center
                    rounded-2xl border transition-all duration-200
                    focus:outline-none focus-visible:ring-2
                    focus-visible:ring-blue-500 focus-visible:ring-offset-2
                    dark:focus-visible:ring-offset-slate-950
                    ${
                        isOpen
                            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300'
                            : 'border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-slate-800 dark:hover:text-blue-300'
                    }
                `}
                title="Notifications & alerts"
            >
                <Bell
                    size={19}
                    className={isOpen ? 'animate-none' : ''}
                />

                {notifications.length > 0 && (
                    <>
                        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                        <span className="absolute -right-1 -top-1 flex h-[19px] min-w-[19px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-extrabold leading-none text-white dark:border-slate-900">
                            {notifications.length > 9
                                ? '9+'
                                : notifications.length}
                        </span>
                    </>
                )}
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Notifications"
                    className="
                        absolute right-0 top-full z-[100]
                        mt-3 flex w-[min(92vw,410px)] flex-col
                        overflow-hidden rounded-2xl
                        border border-slate-200 bg-white
                        shadow-[0_20px_70px_-20px_rgba(15,23,42,0.30)]
                        dark:border-slate-700/80 dark:bg-slate-950
                        dark:shadow-[0_20px_70px_-20px_rgba(0,0,0,0.75)]
                        animate-in fade-in slide-in-from-top-2 duration-200
                    "
                >
                    {/* Header */}
                    <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-blue-950/40">
                        <div className="absolute -right-8 -top-12 h-32 w-32 rounded-full bg-blue-400/10 blur-2xl" />

                        <div className="relative flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                    <Bell size={20} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        Notifications
                                    </h3>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {isPharmacist
                                            ? 'Your pharmacy updates'
                                            : 'System & inventory alerts'}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => fetchNotifs(true)}
                                disabled={refreshing}
                                aria-label="Refresh notifications"
                                className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-blue-400"
                                title="Refresh"
                            >
                                <RefreshCw
                                    size={15}
                                    className={
                                        refreshing ? 'animate-spin' : ''
                                    }
                                />
                            </button>
                        </div>

                        {/* <div className="relative mt-4 grid grid-cols-3 gap-2">
                            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-700/70 dark:bg-slate-900/70">
                                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    Total alerts
                                </p>
                                <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">
                                    {notifications.length}
                                </p>
                            </div>

                            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-2.5 dark:border-amber-500/20 dark:bg-amber-500/5">
                                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                    Low stock
                                </p>
                                <p className="mt-1 text-lg font-extrabold text-amber-700 dark:text-amber-300">
                                    {categoryCounts.STOCK}
                                </p>
                            </div>

                            <div className="rounded-xl border border-rose-200/80 bg-rose-50/70 p-2.5 dark:border-rose-500/20 dark:bg-rose-500/5">
                                <p className="text-[10px] font-medium text-rose-700 dark:text-rose-300">
                                    Expiry
                                </p>
                                <p className="mt-1 text-lg font-extrabold text-rose-700 dark:text-rose-300">
                                    {categoryCounts.EXPIRY}
                                </p>
                            </div>
                        </div> */}
                    </div>

                    {/* Category filters */}
                    <div className="border-b border-slate-100 px-3 pt-3 dark:border-slate-800">
                        <div className="flex gap-1 overflow-x-auto pb-3">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setFilter(tab.id)}
                                    className={`
                                        flex shrink-0 items-center gap-1.5
                                        rounded-xl px-3 py-2 text-[11px]
                                        font-bold transition-all
                                        ${
                                            filter === tab.id
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    {tab.label}
                                    <span
                                        className={`
                                            rounded-md px-1.5 py-0.5 text-[9px]
                                            ${
                                                filter === tab.id
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                            }
                                        `}
                                    >
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-3">
                            <Search
                                size={15}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                                placeholder="Search notifications..."
                                aria-label="Search notifications"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Notification list */}
                    <div className="max-h-[min(55vh,430px)] min-h-[120px] overflow-y-auto overscroll-contain">
                        {loading ? (
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="flex animate-pulse gap-3"
                                    >
                                        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                                        <div className="flex-1 space-y-2 py-1">
                                            <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                                            <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800/70" />
                                            <div className="h-2 w-1/3 rounded bg-slate-100 dark:bg-slate-800/70" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="px-5 py-10 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                                    {searchTerm || filter !== 'ALL' ? (
                                        <Search
                                            size={25}
                                            className="text-slate-400"
                                        />
                                    ) : (
                                        <ShieldCheck
                                            size={27}
                                            className="text-emerald-500"
                                        />
                                    )}
                                </div>

                                <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {searchTerm || filter !== 'ALL'
                                        ? 'No matching alerts'
                                        : 'You’re all caught up!'}
                                </h4>

                                <p className="mx-auto mt-1 max-w-[240px] text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    {searchTerm || filter !== 'ALL'
                                        ? 'Try another search term or category.'
                                        : 'New inventory and purchase updates will appear here.'}
                                </p>

                                {(searchTerm || filter !== 'ALL') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilter('ALL');
                                        }}
                                        className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {filteredNotifications.map((notif) => {
                                    const category = getCategory(notif);
                                    const style = getCategoryStyle(category);
                                    const Icon = style.icon;
                                    const destination = getDestination(notif);
                                    const hasDestination =
                                        Boolean(destination?.tab) ||
                                        Boolean(destination?.url);

                                    return (
                                        <div
                                            key={notif.id}
                                            className="group relative flex gap-3 px-4 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/80"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleNotificationClick(notif)
                                                }
                                                className="flex min-w-0 flex-1 gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
                                                title={
                                                    hasDestination
                                                        ? 'Open related page'
                                                        : 'View notification'
                                                }
                                            >
                                                <div
                                                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}
                                                >
                                                    <Icon
                                                        size={18}
                                                        className={style.iconClass}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <p className="break-words text-xs font-bold leading-5 text-slate-900 dark:text-slate-100">
                                                            {notif.title ||
                                                                'System notification'}
                                                        </p>
                                                    </div>

                                                    <p className="mt-1 break-words text-xs leading-[1.65] text-slate-600 dark:text-slate-400">
                                                        {notif.message ||
                                                            'There is an update available.'}
                                                    </p>

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center rounded-md px-2 py-1 text-[9px] font-bold ${style.badge}`}
                                                        >
                                                            {style.label}
                                                        </span>

                                                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                                                            <Clock size={11} />
                                                            {notif.time ||
                                                                'Recently'}
                                                        </span>

                                                        {hasDestination && (
                                                            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 opacity-100 transition-opacity dark:text-blue-400 sm:opacity-0 sm:group-hover:opacity-100">
                                                                View
                                                                <ArrowUpRight
                                                                    size={12}
                                                                />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={(e) =>
                                                    handleClear(e, notif.id)
                                                }
                                                aria-label={`Dismiss ${notif.title || 'notification'}`}
                                                title="Dismiss notification"
                                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
                        <div className="flex min-w-0 items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                            </span>
                            <span className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                Auto-refreshes every 60 seconds
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);

                                if (typeof onNavigate === 'function') {
                                    onNavigate('notifications');
                                }
                            }}
                            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-extrabold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            View all
                            <ExternalLink size={11} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
