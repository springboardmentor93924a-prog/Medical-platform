import React, { useEffect, useState } from 'react';
import { X, Package, Calendar, AlertTriangle, Zap, Ban } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const FEFOBatchViewer = ({ isOpen, onClose, medicineName }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && medicineName) {
            setLoading(true);
            adminService.getBatchesFEFO(medicineName)
                .then(setData)
                .catch((err) => {
                    console.error("FEFO fetch error:", err);
                    setData(null);
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, medicineName]);

    if (!isOpen) return null;

    const batches = data?.batches || [];
    const availableBatches = batches.filter(b => !b.isExpired && b.quantity > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Zap className="text-amber-500" /> FEFO Batch Priority
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{medicineName}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <p>
                            <strong>FEFO Rule:</strong> Dispense from the batch with the <strong>earliest expiry date</strong> first to minimize wastage.
                        </p>
                    </div>

                    {loading ? (
                        <p className="text-center text-slate-500 py-6">Loading batches...</p>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-8">
                            <BoxX size={36} className="mx-auto text-slate-300 mb-3" />
                            <p className="text-sm font-semibold text-slate-700">No batches registered</p>
                            <p className="text-xs text-slate-500 mt-1">
                                This medicine hasn't been added as a batch yet. Register it first in inventory.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Total Batches</p>
                                    <p className="text-lg font-black text-slate-800">{batches.length}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                                    <p className="text-[10px] uppercase font-bold text-emerald-700">Available</p>
                                    <p className="text-lg font-black text-emerald-800">{data?.totalAvailable || 0}</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                    <p className="text-[10px] uppercase font-bold text-blue-700">Dispensable</p>
                                    <p className="text-lg font-black text-blue-800">{availableBatches.length}</p>
                                </div>
                            </div>

                            {availableBatches.length === 0 && (
                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 flex items-start gap-2">
                                    <Ban size={14} className="mt-0.5 shrink-0" />
                                    <p>
                                        <strong>No dispensable batches.</strong> All batches are either expired or out of stock. Restock before dispensing.
                                    </p>
                                </div>
                            )}

                            {batches.map((batch, idx) => {
                                const isPriority = !batch.isExpired 
                                    && batch.quantity > 0 
                                    && availableBatches[0]?.id === batch.id;

                                return (
                                    <div
                                        key={batch.id || idx}
                                        className={`p-3 rounded-lg border ${
                                            batch.isExpired
                                                ? 'bg-rose-50 border-rose-200'
                                                : batch.isOutOfStock
                                                    ? 'bg-slate-100 border-slate-200 opacity-70'
                                                    : isPriority
                                                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                                                        : 'bg-slate-50 border-slate-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                                                    Batch {batch.batchNumber || 'N/A'}
                                                    {isPriority && (
                                                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                                                            DISPENSE FIRST
                                                        </span>
                                                    )}
                                                    {batch.isExpired && (
                                                        <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">
                                                            EXPIRED — QUARANTINE
                                                        </span>
                                                    )}
                                                    {batch.isOutOfStock && !batch.isExpired && (
                                                        <span className="text-[9px] bg-slate-500 text-white px-1.5 py-0.5 rounded font-bold">
                                                            OUT OF STOCK
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {batch.expiryDate 
                                                        ? `Expires: ${batch.expiryDate}` 
                                                        : 'No expiry set'}
                                                    {batch.daysUntilExpiry !== null && batch.daysUntilExpiry !== undefined && (
                                                        <span className={`ml-1 font-semibold ${
                                                            batch.daysUntilExpiry < 0 ? 'text-rose-600' :
                                                            batch.daysUntilExpiry < 30 ? 'text-amber-600' :
                                                            'text-slate-400'
                                                        }`}>
                                                            ({batch.daysUntilExpiry < 0 
                                                                ? `expired ${Math.abs(batch.daysUntilExpiry)} days ago` 
                                                                : `${batch.daysUntilExpiry} days`})
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right ml-3">
                                                <p className="text-[10px] uppercase text-slate-500">Stock</p>
                                                <p className={`font-black text-lg ${
                                                    batch.quantity === 0 ? 'text-rose-600' : 'text-slate-900'
                                                }`}>
                                                    {batch.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 text-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};