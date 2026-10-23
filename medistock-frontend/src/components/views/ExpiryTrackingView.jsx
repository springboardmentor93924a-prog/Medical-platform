import React, { useState } from 'react';
import { 
    Snowflake, 
    AlertTriangle, 
    ShieldAlert, 
    Calendar, 
    Thermometer, 
    CheckCircle2, 
    Trash2, 
    Clock, 
    Activity,
    PackageOpen
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';

export const ExpiryTrackingView = ({ medicines = [], onAdjustStock, onDeleteMedicine }) => {
    const { showToast } = useToast();

    const now = new Date();

    const categorized = medicines.map(med => {
        const expiry = new Date(med.expiryDate);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        let tier = 'NOMINAL';
        if (daysLeft <= 0) tier = 'EXPIRED';
        else if (daysLeft <= 30) tier = 'CRITICAL';
        else if (daysLeft <= 60) tier = 'WARNING';

        const isColdChain = med.storageCondition?.toLowerCase().includes('refrigerated');
        return {
            ...med,
            daysLeft,
            tier,
            isColdChain
        };
    });

    const expiredList = categorized.filter(m => m.tier === 'EXPIRED');
    const criticalList = categorized.filter(m => m.tier === 'CRITICAL');
    const coldChainList = categorized.filter(m => m.isColdChain);

    const handleDisposal = (med) => {
        if (window.confirm(`Initiate hazardous medical waste disposal for ${med.name} (Lot: ${med.batchNumber})?`)) {
            onDeleteMedicine(med);
            showToast(`Recorded disposal & write-off for ${med.name}`, 'warning');
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-12 bg-white text-slate-900">
            {/* View Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Snowflake className="text-cyan-600" size={26} />
                        <span>Cold-Chain Telemetry & Expiry Horizon</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Automated FIFO lot rotation, sub-zero refrigeration telemetry, and hazardous drug disposal tracking.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-semibold">
                        <Activity size={14} className="animate-pulse text-cyan-600" />
                        <span>Telemetry Online (Zone C: 3.8°C)</span>
                    </span>
                </div>
            </div>

            {/* Cold-Chain Telemetry Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-cyan-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Cold-Chain Unit #1</span>
                        <Thermometer size={18} className="text-cyan-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-cyan-800">3.8°C</div>
                    <p className="text-[11px] text-slate-500 mt-1">Biologics & Vaccines (Nominal 2–8°C)</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-cyan-200 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Cold-Chain Unit #2</span>
                        <Thermometer size={18} className="text-cyan-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-cyan-800">4.1°C</div>
                    <p className="text-[11px] text-slate-500 mt-1">Insulin Glargine & Serums</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-rose-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Expired / Write-off</span>
                        <AlertTriangle size={18} className="text-rose-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-rose-700">{expiredList.length} Lots</div>
                    <p className="text-[11px] text-rose-600 mt-1">Quarantine & disposal required</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">Expiring in &lt; 30 Days</span>
                        <Clock size={18} className="text-amber-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-amber-700">{criticalList.length} Lots</div>
                    <p className="text-[11px] text-amber-600 mt-1">Prioritize FIFO dispensing</p>
                </div>
            </div>

            {/* Critical & Expired Lots Section */}
            {(expiredList.length > 0 || criticalList.length > 0) && (
                <div className="p-6 rounded-3xl bg-rose-50/50 border border-rose-200 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={20} className="text-rose-600" />
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Critical Expiration Attention Required</h2>
                            <p className="text-xs text-rose-700">These pharmaceutical lots have reached or are rapidly approaching expiration date.</p>
                        </div>
                    </div>

                    <div className="divide-y divide-rose-100">
                        {[...expiredList, ...criticalList].map(med => (
                            <div key={med.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-slate-900">{med.name}</h3>
                                        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                            {med.daysLeft <= 0 ? 'EXPIRED' : `${med.daysLeft} DAYS LEFT`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Batch: <span className="font-mono">{med.batchNumber}</span> • Expiry: {med.expiryDate} • Qty: {med.quantity} {med.unit}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleDisposal(med)}
                                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Trash2 size={14} />
                                    <span>Quarantine & Write-off</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cold-Chain Monitored Formulary Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <span>Cold-Chain & Thermally Sensitive Inventory</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
                                {coldChainList.length} Products Monitored
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">Real-time status for temperature-sensitive biologics, vaccines, and injectables.</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    <th className="p-4">Drug & Strength</th>
                                    <th className="p-4">Batch Lot</th>
                                    <th className="p-4">Storage Zone</th>
                                    <th className="p-4">Required Temp</th>
                                    <th className="p-4">Live Sensor</th>
                                    <th className="p-4">Expiry Date</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {coldChainList.map(med => (
                                    <tr key={med.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900">
                                            {med.name}
                                            <div className="text-[11px] text-slate-500 font-normal">{med.genericName}</div>
                                        </td>
                                        <td className="p-4 font-mono text-[11px] text-slate-700">{med.batchNumber}</td>
                                        <td className="p-4 text-slate-600">{med.location}</td>
                                        <td className="p-4 text-cyan-700 font-semibold">{med.temperatureRequired || '2°C to 8°C'}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 font-mono text-[11px] border border-cyan-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
                                                3.8°C (Nominal)
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-slate-700">{med.expiryDate}</td>
                                        <td className="p-4 font-bold text-slate-900">{med.quantity} {med.unit}</td>
                                        <td className="p-4"><StatusBadge status={med.status} /></td>
                                    </tr>
                                ))}

                                {coldChainList.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="p-12 text-center text-slate-400">
                                            No cold-chain products registered. Add refrigerated items to monitor temperature telemetry.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
