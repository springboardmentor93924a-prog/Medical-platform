
import React, { useState, useEffect, useMemo } from 'react';
import {
    Search,
    User,
    Phone,
    CreditCard,
    Printer,
    ShoppingCart,
    Trash2,
    Plus,
    Minus,
    Package,
    Receipt,
    ShieldCheck,
    X,
    LoaderCircle,
    CheckCircle2,
    Boxes,
    IndianRupee,
    AlertCircle
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

export const BillingPOSView = () => {
    const { showToast } = useToast();

    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [discount, setDiscount] = useState(0);

    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchMedicines = async () => {
            try {
                setLoading(true);
                setLoadError(false);

                const data = await adminService.getAllMedicines();

                if (mounted) {
                    setMedicines(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (mounted) {
                    setLoadError(true);
                    showToast('Unable to load medicines', 'error');
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchMedicines();

        return () => {
            mounted = false;
        };
    }, []);

    const filteredMeds = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        if (term.length < 2) return [];

        return medicines
            .filter((medicine) => {
                const name = (medicine.name || '').toLowerCase();
                const batch = (medicine.batchNumber || '').toLowerCase();

                return name.includes(term) || batch.includes(term);
            })
            .slice(0, 6);
    }, [searchTerm, medicines]);

    const subTotal = useMemo(
        () =>
            cart.reduce(
                (sum, item) =>
                    sum + Number(item.unitPrice || 0) * item.cartQty,
                0
            ),
        [cart]
    );

    const discountAmount = Math.min(
        subTotal,
        Math.max(0, Number(discount) || 0)
    );

    const grandTotal = Math.max(0, subTotal - discountAmount);

    const totalUnits = cart.reduce(
        (sum, item) => sum + item.cartQty,
        0
    );

    const formatCurrency = (amount) =>
        `₹${Number(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;

    const addToCart = (medicine) => {
        const availableStock = Number(medicine.quantity || 0);

        if (availableStock <= 0) {
            showToast('This medicine is out of stock!', 'error');
            return;
        }

        const existing = cart.find((item) => item.id === medicine.id);

        if (existing) {
            if (existing.cartQty >= availableStock) {
                showToast('Cannot add more than available stock', 'error');
                return;
            }

            setCart((previous) =>
                previous.map((item) =>
                    item.id === medicine.id
                        ? { ...item, cartQty: item.cartQty + 1 }
                        : item
                )
            );
        } else {
            setCart((previous) => [
                ...previous,
                { ...medicine, cartQty: 1 }
            ]);
        }

        setSearchTerm('');
    };

    const removeFromCart = (id) => {
        setCart((previous) => previous.filter((item) => item.id !== id));
    };

    const updateQty = (id, requestedQty) => {
        if (!Number.isFinite(requestedQty) || requestedQty < 1) return;

        const medicine = medicines.find((item) => item.id === id);

        if (!medicine) return;

        if (requestedQty > Number(medicine.quantity || 0)) {
            showToast('Cannot exceed available stock', 'error');
            return;
        }

        setCart((previous) =>
            previous.map((item) =>
                item.id === id
                    ? { ...item, cartQty: requestedQty }
                    : item
            )
        );
    };

    const changeQty = (item, difference) => {
        const nextQty = item.cartQty + difference;

        if (nextQty < 1) {
            removeFromCart(item.id);
            return;
        }

        updateQty(item.id, nextQty);
    };

    const refreshMedicines = async () => {
        const data = await adminService.getAllMedicines();
        setMedicines(Array.isArray(data) ? data : []);
    };

    const handleCheckout = async () => {
        if (checkoutLoading) return;

        if (cart.length === 0) {
            showToast('Cart is empty', 'error');
            return;
        }

        if (!customerName.trim() || !customerPhone.trim()) {
            showToast('Please fill customer details', 'error');
            return;
        }

        if (cart.some((item) => item.cartQty > Number(
            medicines.find((medicine) => medicine.id === item.id)?.quantity || 0
        ))) {
            showToast('Stock changed. Please review your cart.', 'error');
            return;
        }

        try {
            setCheckoutLoading(true);

            const saleData = {
                customerName: customerName.trim(),
                customerPhone: customerPhone.trim(),
                paymentMethod,
                discountAmount: discountAmount,
                items: cart.map((item) => ({
                    medicineId: item.id,
                    quantity: item.cartQty
                }))
            };

            await adminService.processSale(saleData);

            showToast(
                `Invoice generated! Amount: ${formatCurrency(grandTotal)}`,
                'success'
            );

            setCart([]);
            setCustomerName('');
            setCustomerPhone('');
            setPaymentMethod('CASH');
            setDiscount(0);
            setSearchTerm('');

            try {
                await refreshMedicines();
            } catch {
                showToast('Sale completed, but stock refresh failed.', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Checkout failed', 'error');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:bg-slate-800';

    const labelClass =
        'mb-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300';

    return (
        <div className="min-h-screen space-y-6 bg-slate-50 p-4 pb-10 transition-colors duration-300 dark:bg-slate-950 sm:p-6 lg:p-8">

            {/* Page heading */}
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 ring-1 ring-teal-200 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/20">
                        <Receipt size={24} />
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            Point of Sale
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Create invoices and manage medicine sales.
                        </p>
                    </div>
                </div>

                <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <ShieldCheck size={16} />
                    Inventory-connected billing
                </div>
            </header>

            {/* Quick stats */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <Boxes size={15} />
                        Available medicines
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {loading ? '—' : medicines.length}
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <ShoppingCart size={15} />
                        Items in cart
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                        {totalUnits}
                    </p>
                </div>

                <div className="col-span-2 rounded-2xl border border-teal-200 bg-teal-50 p-4 shadow-sm dark:border-teal-500/20 dark:bg-teal-500/10 sm:col-span-1">
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-300">
                        <IndianRupee size={15} />
                        Current invoice
                    </div>
                    <p className="mt-2 text-2xl font-bold text-teal-800 dark:text-teal-200">
                        {formatCurrency(grandTotal)}
                    </p>
                </div>
            </section>

            {/* Main POS layout */}
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

                {/* LEFT: Medicine search and cart */}
                <section className="min-w-0 space-y-5">

                    {/* Medicine search */}
                    <div className="relative z-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">
                                    Add medicines
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Search by medicine name or batch number.
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                <Search size={19} />
                            </div>
                        </div>

                        <div className="relative">
                            <Search
                                size={18}
                                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Type at least 2 characters..."
                                aria-label="Search medicines"
                                className={`${inputClass} pl-10 pr-10`}
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear medicine search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {searchTerm.trim().length >= 2 && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                                {filteredMeds.length > 0 ? (
                                    filteredMeds.map((medicine) => {
                                        const stock = Number(medicine.quantity || 0);
                                        const inCart = cart.find(
                                            (item) => item.id === medicine.id
                                        );
                                        const unavailable =
                                            stock <= 0 ||
                                            (inCart && inCart.cartQty >= stock);

                                        return (
                                            <button
                                                type="button"
                                                key={medicine.id}
                                                disabled={unavailable}
                                                onClick={() => addToCart(medicine)}
                                                className="flex w-full items-center justify-between gap-3 border-b border-slate-100 p-3.5 text-left transition last:border-b-0 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:hover:bg-teal-500/5"
                                            >
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                                        <Package size={19} />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                                            {medicine.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                            Batch: {medicine.batchNumber || 'N/A'}
                                                            {' · '}
                                                            <span className={stock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                                                                Stock: {stock}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(medicine.unitPrice)}
                                                    </span>
                                                    <Plus size={16} className="text-teal-600 dark:text-teal-400" />
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="flex items-center gap-3 p-4 text-sm text-slate-500 dark:text-slate-400">
                                        <AlertCircle size={18} />
                                        {loading
                                            ? 'Loading medicines...'
                                            : 'No matching medicines found.'}
                                    </div>
                                )}
                            </div>
                        )}

                        {loadError && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                <span>Unable to load the medicine list.</span>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            setLoading(true);
                                            setLoadError(false);
                                            await refreshMedicines();
                                        } catch {
                                            setLoadError(true);
                                            showToast('Unable to load medicines', 'error');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    className="font-bold underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Invoice items */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-5">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">
                                    Invoice items
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Review quantities before completing the sale.
                                </p>
                            </div>

                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {cart.length} {cart.length === 1 ? 'item' : 'items'}
                            </span>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-12 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                    <ShoppingCart size={28} />
                                </div>
                                <h3 className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                                    Your cart is empty
                                </h3>
                                <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    Search for a medicine above and add it to start a new invoice.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop table */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                                            <tr>
                                                <th className="px-5 py-3">Medicine</th>
                                                <th className="px-3 py-3">Price</th>
                                                <th className="px-3 py-3 text-center">Quantity</th>
                                                <th className="px-3 py-3 text-right">Total</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {cart.map((item) => (
                                                <tr key={item.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                                    <td className="max-w-[220px] px-5 py-4">
                                                        <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                                                            {item.name}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            Batch: {item.batchNumber || 'N/A'}
                                                        </p>
                                                    </td>

                                                    <td className="whitespace-nowrap px-3 py-4 text-slate-600 dark:text-slate-300">
                                                        {formatCurrency(item.unitPrice)}
                                                    </td>

                                                    <td className="px-3 py-4">
                                                        <div className="mx-auto flex w-fit items-center gap-2 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
                                                            <button
                                                                type="button"
                                                                onClick={() => changeQty(item, -1)}
                                                                aria-label={`Decrease ${item.name} quantity`}
                                                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                                            >
                                                                <Minus size={13} />
                                                            </button>

                                                            <span className="min-w-5 text-center text-xs font-bold text-slate-800 dark:text-white">
                                                                {item.cartQty}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                disabled={item.cartQty >= Number(item.quantity || 0)}
                                                                onClick={() => changeQty(item, 1)}
                                                                aria-label={`Increase ${item.name} quantity`}
                                                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                                                            >
                                                                <Plus size={13} />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    <td className="whitespace-nowrap px-3 py-4 text-right font-bold text-slate-900 dark:text-white">
                                                        {formatCurrency(Number(item.unitPrice || 0) * item.cartQty)}
                                                    </td>

                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFromCart(item.id)}
                                                            aria-label={`Remove ${item.name}`}
                                                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile-friendly item cards */}
                                <div className="space-y-3 p-3 md:hidden">
                                    {cart.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-700"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                                                        {item.name}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                        Batch: {item.batchNumber || 'N/A'}
                                                    </p>
                                                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                        {formatCurrency(item.unitPrice)} per unit
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    aria-label={`Remove ${item.name}`}
                                                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1 dark:border-slate-700">
                                                    <button
                                                        type="button"
                                                        onClick={() => changeQty(item, -1)}
                                                        aria-label={`Decrease ${item.name} quantity`}
                                                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                                                    >
                                                        <Minus size={14} />
                                                    </button>

                                                    <span className="min-w-5 text-center text-xs font-bold text-slate-800 dark:text-white">
                                                        {item.cartQty}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={item.cartQty >= Number(item.quantity || 0)}
                                                        onClick={() => changeQty(item, 1)}
                                                        aria-label={`Increase ${item.name} quantity`}
                                                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(Number(item.unitPrice || 0) * item.cartQty)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40 sm:px-5">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {totalUnits} total units
                                    </span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-white">
                                        Subtotal: {formatCurrency(subTotal)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </section>

                {/* RIGHT: Customer and payment panel */}
                <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:sticky xl:top-5">
                    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">
                                    Checkout
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Customer and payment details
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 p-5">
                        {/* Customer fields */}
                        <div>
                            <label className={labelClass}>
                                <User size={14} />
                                Customer name *
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(event) => setCustomerName(event.target.value)}
                                placeholder="Enter customer name"
                                autoComplete="name"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                <Phone size={14} />
                                Phone number *
                            </label>
                            <input
                                type="tel"
                                value={customerPhone}
                                onChange={(event) => setCustomerPhone(event.target.value)}
                                placeholder="Enter phone number"
                                autoComplete="tel"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                <CreditCard size={14} />
                                Payment method
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(event) => setPaymentMethod(event.target.value)}
                                className={inputClass}
                            >
                                <option value="CASH">Cash</option>
                                <option value="CARD">Credit / Debit Card</option>
                                <option value="UPI">UPI / Mobile Payment</option>
                            </select>
                        </div>

                        {/* Bill summary */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                            <div className="mb-4 flex items-center gap-2">
                                <Receipt size={16} className="text-teal-600 dark:text-teal-400" />
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    Bill summary
                                </h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between gap-3 text-slate-500 dark:text-slate-400">
                                    <span>Subtotal</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">
                                        {formatCurrency(subTotal)}
                                    </span>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Discount amount
                                    </label>

                                    <div className="relative">
                                        <IndianRupee
                                            size={14}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            max={subTotal}
                                            step="0.01"
                                            value={discount}
                                            onChange={(event) =>
                                                setDiscount(
                                                    Math.max(0, Number(event.target.value) || 0)
                                                )
                                            }
                                            className={`${inputClass} py-2.5 pl-8`}
                                        />
                                    </div>

                                    {Number(discount) > subTotal && (
                                        <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                                            Discount is capped at the subtotal.
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-between gap-3 text-slate-500 dark:text-slate-400">
                                    <span>Discount applied</span>
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                        −{formatCurrency(discountAmount)}
                                    </span>
                                </div>

                                <div className="border-t border-dashed border-slate-300 pt-4 dark:border-slate-600">
                                    <div className="flex items-end justify-between gap-3">
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                            Total payable
                                        </span>
                                        <span className="text-2xl font-black tracking-tight text-teal-700 dark:text-teal-300">
                                            {formatCurrency(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Complete sale */}
                        <button
                            type="button"
                            onClick={handleCheckout}
                            disabled={checkoutLoading || loading || cart.length === 0}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {checkoutLoading ? (
                                <>
                                    <LoaderCircle size={18} className="animate-spin" />
                                    Processing sale...
                                </>
                            ) : (
                                <>
                                    <Printer size={18} />
                                    Confirm sale
                                </>
                            )}
                        </button>

                        <p className="flex items-start justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-400 dark:text-slate-500">
                            <ShieldCheck size={13} className="mt-0.5 shrink-0" />
                            Please verify the items and customer details before completing the sale.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};