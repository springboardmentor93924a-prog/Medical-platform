import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { adminService } from '../../services/adminService'; // Adjust path if needed

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const data = await adminService.getNotifications();
                setNotifications(data);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };
        
        fetchNotifs();
        const interval = setInterval(fetchNotifs, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleClear = async (e, id) => {
        e.stopPropagation(); // Prevent dropdown from closing

        // 1. Save current notifications to a variable
        const previousNotifs = [...notifications];

        // 2. Instantly remove it from the UI (Badge count drops immediately)
        setNotifications(prev => prev.filter(n => n.id !== id));

        // 3. Tell the backend to save the dismissed state
        try {
            await adminService.clearNotification(id);
        } catch (err) {
            console.error("Failed to clear notification", err);
            // If the backend fails, revert the UI so it comes back
            setNotifications(previousNotifs);
        }
    };

    const getIcon = (type) => {
        if (type === 'CRITICAL') return <XCircle size={16} className="text-rose-600" />;
        if (type === 'WARNING') return <AlertTriangle size={16} className="text-amber-600" />;
        return <CheckCircle size={16} className="text-emerald-600" />;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all focus:outline-none"
                title="Notifications & Alerts"
            >
                <Bell size={18} />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-800">Admin System Alerts</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {notifications.length} Alerts
                        </span>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                                No active clinical alerts. All telemetry nominal.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {notifications.map((notif) => (
                                    <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 group">
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                                            <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                                                <Clock size={10} /> {notif.time}
                                            </p>
                                        </div>
                                        {/* DISMISS BUTTON */}
                                        <button 
                                            onClick={(e) => handleClear(e, notif.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded self-start"
                                            title="Dismiss alert"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <span className="text-[11px] text-slate-500 font-medium">
                            Integrated with Hospital GxP & Cold-Chain Telemetry
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};