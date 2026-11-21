import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, XCircle, X } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const NotificationsView = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifs = async () => {
        try {
            const data = await adminService.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifs(); }, []);

    const handleClear = async (id) => {
        // Optimistic UI update
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await adminService.clearNotification(id);
        } catch (err) {
            console.error(err);
            fetchNotifs(); // revert on error
        }
    };

    const getIcon = (type) => {
        if (type === 'CRITICAL') return <XCircle size={20} className="text-rose-600" />;
        if (type === 'WARNING') return <AlertTriangle size={20} className="text-amber-600" />;
        return <CheckCircle size={20} className="text-emerald-600" />;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading alerts...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <Bell className="text-blue-600" size={28} />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Notifications Center</h1>
                    <p className="text-sm text-slate-500">System alerts, low stock, and expiry warnings.</p>
                </div>
            </div>

            {notifications.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4 opacity-50" />
                    <h2 className="text-lg font-bold text-slate-800">All caught up!</h2>
                    <p className="text-slate-500 text-sm mt-1">No active alerts. Your inventory is healthy.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 hover:bg-slate-50 flex items-start gap-4 group">
                            <div className="mt-1 shrink-0">{getIcon(notif.type)}</div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-900">{notif.title}</h3>
                                <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                    <Clock size={12} /> {notif.time}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleClear(notif.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Dismiss"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};