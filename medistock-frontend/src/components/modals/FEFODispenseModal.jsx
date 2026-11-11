import React, { useState, useEffect } from 'react';
import { X, Package, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const FEFODispenseModal = ({ isOpen, onClose, medicineName, medicineId, onSuccess }) => {
    const [batches, setBatches] = useState([]);
    const [totalAvailable, setTotalAvailable] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [dispensing, setDispensing] = useState(false);

    useEffect(() => {
        if (isOpen && medicineName) {
            setLoading(true);
            adminService.getBatchesFEFO(medicineName)
                .then(data => {
                    setBatches(data.batches || []);
                    setTotalAvailable(data.totalAvailable || 0);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
            setQuantity(1);
        }
    }, [isOpen, medicineName]);

    if (!isOpen) return null;

    // Compute FEFO preview
    const previewAllocation = () => {
        let remaining = quantity;
        return batches.map(b => {
            if (remaining <= 0 || b.isExpired) return { ...b, take: 0 };
            const take = Math.min(b.quantity, remaining);
            remaining -= take;
            return { ...b, take };
        });
    };

    const handleDispense = async () => {
        if (quantity <= 0) return alert("Quantity must be greater than 0");
        if (quantity > totalAvailable) return alert("Not enough stock available");

        setDispensing(true);
        try {
            const result = await adminService.dispenseFEFO(medicineId, quantity, "POS Sale (FEFO)");
            alert(`✅ Dispensed ${result.requestedQuantity} units across ${result.batchesUsed} batch(es)\n\n` +
                result.allocations.map(a =>
                    `• Batch ${a.batchNumber}: ${a.deducted} units (expires ${a.expiryDate})`
                ).join('\n'));
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            alert("Dispense failed: " + (err.response?.data?.error || err.message));
        } finally {
            setDispensing(false);
        }
    };

    const preview = previewAllocation();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Package className="text-blue-600" /> Dispense: {medicineName}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            FEFO auto-selects the batch expiring soonest.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Loading batches...</p>
                    ) : (
                        <>
                            {/* Quantity input */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Quantity to Dispense
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={totalAvailable}
                                    value={quantity}
                                    onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-lg font-bold"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Available: <strong>{totalAvailable}</strong> units across {batches.length} batch(es)
                                </p>
                            </div>

                            {/* Batch breakdown */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                                    FEFO Batch Allocation
                                </p>
                                <div className="space-y-2">
                                    {preview.map((b, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-lg border flex justify-between items-center ${
                                                b.isExpired
                                                    ? 'bg-rose-50 border-rose-200'
                                                    : b.take > 0
                                                        ? 'bg-emerald-50 border-emerald-200'
                                                        : 'bg-slate-50 border-slate-200'
                                            }`}
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-slate-900">
                                                    Batch {b.batchNumber}
                                                    {idx === 0 && !b.isExpired && (
                                                        <span className="ml-2 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                                                            FEFO PRIORITY
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Calendar size={10} />
                                                    Expires: {b.expiryDate || 'N/A'}
                                                    {b.daysUntilExpiry !== null && (
                                                        <span className={`ml-1 ${
                                                            b.daysUntilExpiry < 0 ? 'text-rose-600 font-bold' :
                                                            b.daysUntilExpiry < 30 ? 'text-amber-600 font-bold' :
                                                            'text-slate-400'
                                                        }`}>
                                                            ({b.daysUntilExpiry} days)
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-500">Take</p>
                                                <p className={`font-black ${
                                                    b.take > 0 ? 'text-emerald-600' : 'text-slate-400'
                                                }`}>
                                                    {b.take} / {b.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {batches.some(b => b.isExpired) && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-xs text-amber-800">
                                        <strong>Note:</strong> Expired batches are automatically excluded from allocation. Quarantine them separately.
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDispense}
                        disabled={dispensing || quantity <= 0 || quantity > totalAvailable}
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        <CheckCircle size={16} /> {dispensing ? 'Dispensing...' : 'Confirm Dispense'}
                    </button>
                </div>
            </div>
        </div>
    );
};