import React from 'react';
import { StockStatus } from '../../types';

export const StatusBadge = ({ status }) => {
    switch (status) {
        case StockStatus.IN_STOCK:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    In Stock
                </span>
            );
        case StockStatus.LOW_STOCK:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    Low Stock
                </span>
            );
        case StockStatus.EXPIRING_SOON:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    Expiring Soon
                </span>
            );
        case StockStatus.OUT_OF_STOCK:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    Out of Stock
                </span>
            );
        case StockStatus.EXPIRED:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Expired
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {status || 'Unknown'}
                </span>
            );
    }
};
