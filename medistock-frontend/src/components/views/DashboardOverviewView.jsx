import React, { useState } from 'react';
import { 
    Pill, 
    AlertTriangle, 
    Snowflake, 
    DollarSign, 
    TrendingUp, 
    ShieldCheck, 
    ExternalLink, 
    ArrowUpRight, 
    Plus,
    Activity,
    Thermometer,
    PackageOpen
} from 'lucide-react';
import { FACILITY_GALLERY } from '../../assets/images';
import { StatusBadge } from '../common/StatusBadge';
import { FacilityImageModal } from '../common/FacilityImageModal';

export const DashboardOverviewView = ({ 
    medicines = [], 
    suppliers = [], 
    auditLogs = [], 
    onNavigate, 
    onOpenAddMedicine 
}) => {
    const [selectedImageItem, setSelectedImageItem] = useState(null);

    // Compute key KPIs
    const totalItems = medicines.length;
    const totalUnits = medicines.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const totalValuation = medicines.reduce((sum, m) => sum + ((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0)), 0);

    const lowStockItems = medicines.filter(m => m.status === 'LOW_STOCK');
    const outOfStockItems = medicines.filter(m => m.status === 'OUT_OF_STOCK');
    const expiringSoonItems = medicines.filter(m => m.status === 'EXPIRING_SOON');
    const coldChainItems = medicines.filter(m => m.storageCondition?.toLowerCase().includes('refrigerated'));

    return (
        <div className="space-y-8 animate-fadeIn pb-12 bg-white text-slate-900">
            {/* Top Welcome & Quick Actions Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-6 rounded-3xl border border-emerald-200/80 shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
                        <Activity size={14} className="animate-pulse" />
                        <span>Formulary Telemetry Active</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Pharmacy Operations Center
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                        Clean pharmaceutical formulary oversight, sub-zero cold-chain telemetry, and automated expiration monitoring.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <button
                        onClick={onOpenAddMedicine}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Add Product</span>
                    </button>
                    <button
                        onClick={() => onNavigate('expiry')}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Snowflake size={16} className="text-cyan-600" />
                        <span>Cold-Chain Status</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Valuation */}
                <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Total Formulary Value</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <DollarSign size={18} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">
                            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                        <ArrowUpRight size={14} />
                        <span>{totalUnits} units across {totalItems} SKUs</span>
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div 
                    onClick={() => onNavigate('inventory')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all shadow-sm cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Low Stock Reorders</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                            <AlertTriangle size={18} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{lowStockItems.length + outOfStockItems.length}</span>
                        <span className="text-xs text-rose-600 font-semibold">({outOfStockItems.length} Out of Stock)</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                        <span>Requires procurement review</span>
                    </div>
                </div>

                {/* Cold Chain Monitored */}
                <div 
                    onClick={() => onNavigate('expiry')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-cyan-300 transition-all shadow-sm cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Cold-Chain Monitored</span>
                        <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                            <Snowflake size={18} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{coldChainItems.length}</span>
                        <span className="text-xs text-slate-500">Vaccines / Biologics</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-cyan-700 font-medium">
                        <Thermometer size={13} />
                        <span>2°C to 8°C regulated sensors</span>
                    </div>
                </div>

                {/* Expiring Horizon */}
                <div 
                    onClick={() => onNavigate('expiry')}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 transition-all shadow-sm cursor-pointer"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Expiring Within 45 Days</span>
                        <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900">{expiringSoonItems.length}</span>
                        <span className="text-xs text-orange-600 font-semibold">Priority Lots</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-orange-700 font-medium">
                        <span>FIFO dispensing rule active</span>
                    </div>
                </div>
            </div>

            {/* Operational Facility & Image Gallery */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span>Operational Facility & Storage Vaults</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200">
                                5 Monitored Zones
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Click any zone to inspect live environmental telemetry and temperature logs.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {FACILITY_GALLERY.map((facility) => (
                        <div
                            key={facility.id}
                            onClick={() => setSelectedImageItem(facility)}
                            className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200 hover:border-emerald-500 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col h-64"
                        >
                            {/* Image */}
                            <div className="h-36 w-full overflow-hidden bg-slate-100 relative">
                                <img
                                    src={facility.imageUrl}
                                    alt={facility.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/95 text-emerald-800 shadow-sm border border-slate-200">
                                    {facility.badge}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                                        {facility.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                        {facility.subtitle}
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                    <span className="text-slate-500">{facility.zone}</span>
                                    <span className="text-cyan-700 font-semibold">{facility.temperature}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom 2 Columns: Critical Formulary Needs & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Urgent Stock Attention */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-600" />
                            <h3 className="text-sm font-bold text-slate-900">Stock Requiring Clinical Review</h3>
                        </div>
                        <button
                            onClick={() => onNavigate('inventory')}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                            <span>Open Inventory</span>
                            <ArrowUpRight size={13} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {medicines.filter(m => m.status !== 'IN_STOCK').slice(0, 4).map(med => (
                            <div key={med.id} className="py-3 flex items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs font-bold text-slate-900">{med.name}</p>
                                        <span className="text-[10px] text-slate-400 font-mono">Lot {med.batchNumber}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500">
                                        Qty: <strong className="text-slate-800">{med.quantity}</strong> (Min: {med.minQuantity}) • {med.storageCondition}
                                    </p>
                                </div>
                                <StatusBadge status={med.status} />
                            </div>
                        ))}
                        {medicines.length === 0 && (
                            <div className="py-10 text-center space-y-2">
                                <PackageOpen size={32} className="mx-auto text-slate-300" />
                                <p className="text-xs font-semibold text-slate-700">Database is empty</p>
                                <p className="text-[11px] text-slate-400">Register new medicines to track inventory and expiry levels.</p>
                                <button
                                    onClick={onOpenAddMedicine}
                                    className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                                >
                                    + Add First Product
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Compliance Audit Trail Preview */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-teal-600" />
                            <h3 className="text-sm font-bold text-slate-900">Recent Compliance & Dispense Trail</h3>
                        </div>
                        <button
                            onClick={() => onNavigate('audit')}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                            <span>View All Logs</span>
                            <ArrowUpRight size={13} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {auditLogs.slice(0, 4).map(log => (
                            <div key={log.id} className="py-3">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-semibold text-slate-800">{log.userName} ({log.userRole})</span>
                                    <span className="text-slate-400 font-mono text-[10px]">
                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">{log.details}</p>
                            </div>
                        ))}
                        {auditLogs.length === 0 && (
                            <div className="py-10 text-center text-xs text-slate-400">
                                No audit records logged. Actions will appear here automatically.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            <FacilityImageModal
                item={selectedImageItem}
                onClose={() => setSelectedImageItem(null)}
            />
        </div>
    );
};
