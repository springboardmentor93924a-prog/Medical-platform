
import React, { useState, useEffect } from 'react';
import {
    X, ShoppingCart, Plus, Trash2, Package,
    Truck, IndianRupee, Hash, Loader2,
    AlertCircle, ChevronDown, ClipboardList
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const GeneratePOModal = ({ isOpen, onClose, onSave }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [items, setItems] = useState([
        { medicineId: '', quantity: 1, unitPrice: 0 }
    ]);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            setError('');

            try {
                const [supplierData, medicineData] = await Promise.all([
                    adminService.getAllSuppliers(),
                    adminService.getAllMedicines()
                ]);

                setSuppliers(supplierData || []);
                setMedicines(medicineData || []);
            } catch (err) {
                setError('Unable to load suppliers or medicines. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    const totalAmount = items.reduce(
        (sum, item) =>
            sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
    );

    const totalItems = items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0),
        0
    );

    const handleAddItem = () => {
        setItems(prev => [
            ...prev,
            { medicineId: '', quantity: 1, unitPrice: 0 }
        ]);
    };

    const handleRemoveItem = (index) => {
        if (items.length === 1) return;
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        setItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            if (field === 'medicineId') {
                const medicine = medicines.find(
                    m => m.id.toString() === value
                );

                updated[index].unitPrice = medicine
                    ? Number(medicine.unitPrice) || 0
                    : 0;
            }

            return updated;
        });
    };

    const resetForm = () => {
        setSelectedSupplier('');
        setItems([{ medicineId: '', quantity: 1, unitPrice: 0 }]);
        setError('');
    };

    const handleClose = () => {
        if (submitting) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedSupplier) {
            setError('Please select a supplier.');
            return;
        }

        const validItems = items.filter(
            item => item.medicineId && Number(item.quantity) > 0
        );

        if (validItems.length === 0) {
            setError('Please add at least one valid medicine.');
            return;
        }

        if (validItems.length !== items.length) {
            setError('Please select a medicine for every order item.');
            return;
        }

        setSubmitting(true);

        try {
            await onSave({
                supplierId: parseInt(selectedSupplier),
                items: validItems.map(item => ({
                    medicineId: parseInt(item.medicineId),
                    quantity: parseInt(item.quantity),
                    unitPrice: parseFloat(item.unitPrice)
                }))
            });
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to generate purchase order.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const inputClass = `
        w-full rounded-xl border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-900
        px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100
        outline-none transition-all
        focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15
        disabled:opacity-60
    `;

    const labelClass = `
        mb-2 block text-xs font-bold uppercase tracking-wider
        text-slate-500 dark:text-slate-400
    `;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">

            <div className="
                flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden
                rounded-2xl border border-slate-200 bg-white shadow-2xl
                dark:border-slate-700 dark:bg-slate-900
            ">

                {/* Header */}
                <div className="
                    relative flex items-center justify-between overflow-hidden
                    border-b border-slate-200 bg-slate-50 px-5 py-4
                    dark:border-slate-700 dark:bg-slate-800/80 sm:px-6
                ">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

                    <div className="relative flex items-center gap-3">
                        <div className="
                            flex h-11 w-11 items-center justify-center rounded-xl
                            bg-blue-100 text-blue-600
                            dark:bg-blue-500/15 dark:text-blue-400
                        ">
                            <ShoppingCart size={21} />
                        </div>

                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                Generate Purchase Order
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Create and manage your medicine order
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="
                            relative rounded-lg p-2 text-slate-400 transition
                            hover:bg-slate-200 hover:text-slate-700
                            dark:hover:bg-slate-700 dark:hover:text-white
                            disabled:opacity-50
                        "
                    >
                        <X size={19} />
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">

                        {/* Supplier */}
                        <section>
                            <div className="mb-3 flex items-center gap-2">
                                <Truck size={16} className="text-blue-500" />
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Supplier Information
                                </h3>
                            </div>

                            <label className={labelClass}>
                                Select Supplier <span className="text-rose-500">*</span>
                            </label>

                            <div className="relative">
                                <select
                                    required
                                    value={selectedSupplier}
                                    disabled={loading || submitting}
                                    onChange={e => setSelectedSupplier(e.target.value)}
                                    className={`${inputClass} appearance-none pr-10`}
                                >
                                    <option value="">Choose a supplier</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown
                                    size={17}
                                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                            </div>
                        </section>

                        {/* Order Items */}
                        <section>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Package size={16} className="text-blue-500" />
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        Order Items
                                    </h3>
                                    <span className="
                                        rounded-md bg-blue-50 px-2 py-0.5 text-[10px]
                                        font-bold text-blue-600
                                        dark:bg-blue-500/10 dark:text-blue-400
                                    ">
                                        {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleAddItem}
                                    disabled={loading || submitting}
                                    className="
                                        inline-flex items-center gap-1.5 rounded-lg
                                        border border-blue-200 bg-blue-50 px-3 py-2
                                        text-xs font-bold text-blue-700 transition
                                        hover:bg-blue-100
                                        dark:border-blue-500/30 dark:bg-blue-500/10
                                        dark:text-blue-400 dark:hover:bg-blue-500/20
                                    "
                                >
                                    <Plus size={15} />
                                    Add Item
                                </button>
                            </div>

                            {loading ? (
                                <div className="
                                    flex items-center justify-center gap-2 rounded-xl
                                    border border-slate-200 py-12 text-sm text-slate-500
                                    dark:border-slate-700 dark:text-slate-400
                                ">
                                    <Loader2 size={18} className="animate-spin" />
                                    Loading suppliers and medicines...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="
                                                rounded-xl border border-slate-200
                                                bg-slate-50/80 p-3.5 transition
                                                dark:border-slate-700 dark:bg-slate-800/50
                                            "
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="
                                                    flex items-center gap-2 text-xs
                                                    font-bold text-slate-600
                                                    dark:text-slate-300
                                                ">
                                                    <span className="
                                                        flex h-6 w-6 items-center
                                                        justify-center rounded-lg
                                                        bg-blue-100 text-[11px]
                                                        text-blue-700
                                                        dark:bg-blue-500/15 dark:text-blue-400
                                                    ">
                                                        {index + 1}
                                                    </span>
                                                    Medicine Details
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItem(index)}
                                                    disabled={items.length === 1 || submitting}
                                                    title="Remove item"
                                                    className="
                                                        rounded-lg p-1.5 text-slate-400
                                                        transition hover:bg-rose-100
                                                        hover:text-rose-600
                                                        dark:hover:bg-rose-500/10
                                                        dark:hover:text-rose-400
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-30
                                                    "
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">

                                                {/* Medicine */}
                                                <div className="sm:col-span-6">
                                                    <label className={labelClass}>
                                                        Medicine <span className="text-rose-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            required
                                                            value={item.medicineId}
                                                            disabled={submitting}
                                                            onChange={e => handleItemChange(
                                                                index, 'medicineId', e.target.value
                                                            )}
                                                            className={`${inputClass} appearance-none pr-9`}
                                                        >
                                                            <option value="">Select medicine</option>
                                                            {medicines.map(medicine => (
                                                                <option key={medicine.id} value={medicine.id}>
                                                                    {medicine.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown
                                                            size={16}
                                                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Quantity */}
                                                <div className="sm:col-span-3">
                                                    <label className={labelClass}>
                                                        Quantity
                                                    </label>
                                                    <div className="relative">
                                                        <Hash
                                                            size={14}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <input
                                                            type="number"
                                                            required
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            disabled={submitting}
                                                            onChange={e => handleItemChange(
                                                                index, 'quantity', e.target.value
                                                            )}
                                                            className={`${inputClass} pl-8`}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Unit Price */}
                                                <div className="sm:col-span-3">
                                                    <label className={labelClass}>
                                                        Unit Price
                                                    </label>
                                                    <div className="relative">
                                                        <IndianRupee
                                                            size={14}
                                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                                        />
                                                        <input
                                                            type="number"
                                                            value={item.unitPrice}
                                                            readOnly
                                                            className={`
                                                                ${inputClass} cursor-not-allowed
                                                                bg-slate-100 pl-8
                                                                dark:bg-slate-950
                                                            `}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="
                                                mt-3 flex items-center justify-between
                                                border-t border-slate-200 pt-2.5
                                                dark:border-slate-700
                                            ">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    Item Subtotal
                                                </span>
                                                <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                                                    ₹{(
                                                        (Number(item.quantity) || 0) *
                                                        (Number(item.unitPrice) || 0)
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Error */}
                        {error && (
                            <div className="
                                flex items-start gap-2.5 rounded-xl border
                                border-rose-200 bg-rose-50 p-3.5
                                text-sm text-rose-700
                                dark:border-rose-500/20 dark:bg-rose-500/10
                                dark:text-rose-400
                            ">
                                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Order Summary */}
                        <section className="
                            overflow-hidden rounded-xl border border-blue-200
                            bg-blue-50/70 dark:border-blue-500/20
                            dark:bg-blue-500/5
                        ">
                            <div className="
                                flex items-center gap-2 border-b border-blue-100
                                px-4 py-3 dark:border-blue-500/15
                            ">
                                <ClipboardList size={16} className="text-blue-600 dark:text-blue-400" />
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Order Summary
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 p-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Total Quantity
                                    </p>
                                    <p className="mt-1 text-lg font-extrabold text-slate-800 dark:text-white">
                                        {totalItems}
                                        <span className="ml-1 text-xs font-medium text-slate-500">
                                            units
                                        </span>
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Total Order Amount
                                    </p>
                                    <p className="mt-1 text-xl font-black text-blue-700 dark:text-blue-400">
                                        ₹{totalAmount.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="
                        flex flex-col-reverse gap-2 border-t border-slate-200
                        bg-slate-50 px-5 py-4 dark:border-slate-700
                        dark:bg-slate-800/60 sm:flex-row sm:justify-end sm:px-6
                    ">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="
                                rounded-xl border border-slate-200 bg-white
                                px-5 py-2.5 text-xs font-bold text-slate-600
                                transition hover:bg-slate-100
                                dark:border-slate-600 dark:bg-slate-800
                                dark:text-slate-300 dark:hover:bg-slate-700
                                disabled:opacity-50
                            "
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading || submitting || medicines.length === 0}
                            className="
                                inline-flex items-center justify-center gap-2
                                rounded-xl bg-blue-600 px-6 py-2.5
                                text-xs font-bold text-white shadow-lg
                                shadow-blue-600/20 transition
                                hover:bg-blue-700 active:scale-[0.98]
                                disabled:cursor-not-allowed disabled:opacity-50
                            "
                        >
                            {submitting ? (
                                <>
                                    <Loader2 size={15} className="animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={15} />
                                    Generate Purchase Order
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
