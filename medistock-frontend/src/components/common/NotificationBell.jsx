import React, { useState, useRef, useEffect } from 'react';
import { Bell, AlertTriangle, Snowflake, CheckCircle, Clock } from 'lucide-react';

export const NotificationBell = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const notifications = [];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm transition-all focus:outline-none"
                title="Notifications & Alerts"
            >
                <Bell size={18} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-800">Clinical Telemetry Alerts</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            0 New
                        </span>
                    </div>

                    <div className="p-8 text-center text-xs text-slate-400">
                        No active clinical alerts. All telemetry nominal.
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
