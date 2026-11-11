import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    ClipboardList,
    Clock,
    PackageCheck,
    Ban,
    IndianRupee,
    FileText,
    RefreshCw,
    X,
    ArrowUpRight,
    Truck,
    CalendarDays,
    ShieldCheck,
    SearchX,
    Filter,
    Activity,
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { GeneratePOModal } from '../modals/GeneratePOModal';
import { ViewPOModal } from '../modals/ViewPOModal';
import { DeletePOModal } from '../modals/DeletePOModal';

export const PurchaseOrdersView = ({ role }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [refreshing, setRefreshing] = useState(false);

    // Existing modal states
    const [isGenOpen, setIsGenOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const isAdmin = role === 'ADMIN';
    const isPharmacist = role === 'PHARMACIST';

    const fetchOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data = await adminService.getPurchaseOrders();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setOrders([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDelete = async (id) => {
        await adminService.deletePurchaseOrder(id);
        setIsDeleteOpen(false);
        await fetchOrders();
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await adminService.updatePurchaseOrderStatus(id, status);
            await fetchOrders(true);
        } catch (err) {
            console.error(err);
            alert(`Failed to update purchase order status: ${err.message || 'Please try again.'}`);
        }
    };

    const filteredOrders = orders.filter((order) => {
        const query = search.trim().toLowerCase();

        const matchesSearch =
            order.orderNumber?.toLowerCase().includes(query) ||
            order.supplierName?.toLowerCase().includes(query) ||
            String(order.id).includes(query);

        const matchesStatus =
            statusFilter === 'ALL' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusConfig = {
        PENDING: {
            label: 'Pending',
            icon: Clock,
            badge:
                'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
            dot: 'bg-amber-500',
            card:
                'border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/5',
        },
        APPROVED: {
            label: 'Approved',
            icon: CheckCircle,
            badge:
                'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
            dot: 'bg-blue-500',
            card:
                'border-blue-200 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/5',
        },
        REJECTED: {
            label: 'Rejected',
            icon: Ban,
            badge:
                'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
            dot: 'bg-rose-500',
            card:
                'border-rose-200 bg-rose-50/70 dark:border-rose-500/20 dark:bg-rose-500/5',
        },
        RECEIVED: {
            label: 'Received',
            icon: PackageCheck,
            badge:
                'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
            dot: 'bg-emerald-500',
            card:
                'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/5',
        },
    };

    const getStatus = (status) =>
        statusConfig[status] || {
            label: status || 'Unknown',
            icon: Activity,
            badge:
                'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
            dot: 'bg-slate-400',
            card: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50',
        };

    const formatAmount = (amount) => {
        const value = Number(amount);
        return Number.isFinite(value)
            ? value.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })
            : '0.00';
    };

    const formatDate = (date) => {
        if (!date) return '—';

        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) return '—';

        return parsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const statusFilters = [
        { label: 'All orders', value: 'ALL' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Received', value: 'RECEIVED' },
        { label: 'Rejected', value: 'REJECTED' },
    ];

    const summaryCards = [
        {
            label: 'Total orders',
            value: orders.length,
            icon: ClipboardList,
            iconStyle:
                'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
            accent: 'from-blue-500 to-indigo-500',
            filter: 'ALL',
            description: 'All purchase orders',
        },
        {
            label: 'Awaiting approval',
            value: orders.filter((order) => order.status === 'PENDING').length,
            icon: Clock,
            iconStyle:
                'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
            accent: 'from-amber-400 to-orange-500',
            filter: 'PENDING',
            description: 'Require admin review',
        },
        {
            label: 'Approved',
            value: orders.filter((order) => order.status === 'APPROVED').length,
            icon: CheckCircle,
            iconStyle:
                'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
            accent: 'from-sky-400 to-blue-500',
            filter: 'APPROVED',
            description: 'Approved for procurement',
        },
        {
            label: 'Received',
            value: orders.filter((order) => order.status === 'RECEIVED').length,
            icon: PackageCheck,
            iconStyle:
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
            accent: 'from-emerald-400 to-teal-500',
            filter: 'RECEIVED',
            description: 'Orders marked received',
        },
    ];

    const openOrder = (order) => {
        setSelectedOrder(order);
        setIsViewOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 transition-colors duration-300 dark:bg-[#0b1120] dark:text-slate-100 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1500px] space-y-7">

                {/* Page header */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-20 right-1/3 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
                                <FileText size={27} />
                            </div>

                            <div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                        Procurement management
                                    </span>

                                    {isAdmin && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300">
                                            <ShieldCheck size={12} />
                                            Admin
                                        </span>
                                    )}

                                    {isPharmacist && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                            <ShieldCheck size={12} />
                                            Pharmacist
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    Purchase Orders
                                </h1>

                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {isPharmacist
                                        ? 'Create purchase orders, track approval progress, and review supplier procurement details.'
                                        : 'Review incoming purchase requests, manage approvals, and monitor procurement activity.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => fetchOrders(true)}
                                disabled={loading || refreshing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                            >
                                <RefreshCw
                                    size={16}
                                    className={refreshing ? 'animate-spin' : ''}
                                />
                                Refresh
                            </button>

                            {isPharmacist && (
                                <button
                                    type="button"
                                    onClick={() => setIsGenOpen(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                >
                                    <Plus size={18} />
                                    Generate PO
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {/* Summary cards */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((card) => {
                        const Icon = card.icon;
                        const isSelected = statusFilter === card.filter;

                        return (
                            <button
                                key={card.label}
                                type="button"
                                onClick={() => setStatusFilter(card.filter)}
                                className={`group relative overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-900 ${
                                    isSelected
                                        ? 'border-blue-300 ring-2 ring-blue-500/10 dark:border-blue-500/40 dark:ring-blue-500/10'
                                        : 'border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent} opacity-80`} />

                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {card.label}
                                        </p>
                                        <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                            {loading ? '—' : card.value}
                                        </p>
                                    </div>

                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105 ${card.iconStyle}`}>
                                        <Icon size={23} />
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-2">
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        {card.description}
                                    </p>
                                    <ArrowUpRight
                                        size={15}
                                        className={`shrink-0 transition ${
                                            isSelected
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-slate-300 group-hover:text-blue-500 dark:text-slate-600'
                                        }`}
                                    />
                                </div>
                            </button>
                        );
                    })}
                </section>

                {/* Orders directory */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    {/* Search and filter header */}
                    <div className="space-y-5 border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                    Order directory
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Search orders and review their current status.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative w-full sm:min-w-[280px] xl:w-[340px]">
                                    <Search
                                        size={17}
                                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                    />

                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search PO number, supplier, ID..."
                                        aria-label="Search purchase orders"
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                                    />

                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            aria-label="Clear search"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                <Filter size={14} />
                                Filter by status
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {statusFilters.map((filter) => {
                                    const isActive = statusFilter === filter.value;

                                    const count =
                                        filter.value === 'ALL'
                                            ? orders.length
                                            : orders.filter(
                                                  (order) => order.status === filter.value
                                              ).length;

                                    return (
                                        <button
                                            key={filter.value}
                                            type="button"
                                            onClick={() => setStatusFilter(filter.value)}
                                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                                                isActive
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                                            }`}
                                        >
                                            {filter.label}
                                            <span
                                                className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                                                    isActive
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                                }`}
                                            >
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="bg-slate-50/90 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="px-5 py-4">Order ID</th>
                                    <th className="px-5 py-4">PO number</th>
                                    <th className="px-5 py-4">Supplier</th>
                                    <th className="px-5 py-4">Order date</th>
                                    <th className="px-5 py-4">Total amount</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-center">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            {Array.from({ length: 7 }).map((__, cellIndex) => (
                                                <td key={cellIndex} className="px-5 py-5">
                                                    <div className="h-4 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-16 text-center">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                <SearchX size={25} />
                                            </div>
                                            <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
                                                No purchase orders found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {search || statusFilter !== 'ALL'
                                                    ? 'Try changing your search or status filter.'
                                                    : 'Purchase orders will appear here when available.'}
                                            </p>

                                            {(search || statusFilter !== 'ALL') && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSearch('');
                                                        setStatusFilter('ALL');
                                                    }}
                                                    className="mt-4 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                                >
                                                    Clear filters
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => {
                                        const status = getStatus(order.status);
                                        const StatusIcon = status.icon;

                                        return (
                                            <tr
                                                key={order.id}
                                                className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-5 py-5">
                                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                        #{order.id}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                            <FileText size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold text-slate-800 dark:text-slate-100">
                                                                {order.orderNumber || '—'}
                                                            </p>
                                                            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                                Purchase order
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            <Truck size={16} />
                                                        </div>
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                                                            {order.supplierName || '—'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                        <CalendarDays
                                                            size={15}
                                                            className="text-slate-400"
                                                        />
                                                        <span className="whitespace-nowrap text-xs font-medium">
                                                            {formatDate(order.orderDate)}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex items-center gap-1 font-extrabold tabular-nums text-slate-900 dark:text-white">
                                                        <IndianRupee size={14} className="text-slate-400" />
                                                        {formatAmount(order.totalAmount)}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[11px] font-extrabold ${status.badge}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openOrder(order)}
                                                            title="View order details"
                                                            aria-label={`View order ${order.orderNumber || order.id}`}
                                                            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {isAdmin && order.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStatusUpdate(order.id, 'APPROVED')
                                                                    }
                                                                    title="Approve purchase order"
                                                                    aria-label={`Approve order ${order.orderNumber || order.id}`}
                                                                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                                                                >
                                                                    <CheckCircle size={16} />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStatusUpdate(order.id, 'REJECTED')
                                                                    }
                                                                    title="Reject purchase order"
                                                                    aria-label={`Reject order ${order.orderNumber || order.id}`}
                                                                    className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedOrder(order);
                                                                    setIsDeleteOpen(true);
                                                                }}
                                                                title="Delete purchase order"
                                                                aria-label={`Delete order ${order.orderNumber || order.id}`}
                                                                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile and tablet order cards */}
                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:hidden">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="animate-pulse rounded-2xl border border-slate-200 p-5 dark:border-slate-800"
                                >
                                    <div className="h-5 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                                    <div className="mt-4 h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800" />
                                    <div className="mt-3 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                                    <div className="mt-6 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                                </div>
                            ))
                        ) : filteredOrders.length === 0 ? (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
                                <SearchX size={29} className="mx-auto text-slate-400" />
                                <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">
                                    No purchase orders found
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Try another search or change the status filter.
                                </p>
                                {(search || statusFilter !== 'ALL') && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch('');
                                            setStatusFilter('ALL');
                                        }}
                                        className="mt-3 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                    >
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredOrders.map((order) => {
                                const status = getStatus(order.status);
                                const StatusIcon = status.icon;

                                return (
                                    <article
                                        key={order.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <FileText size={20} />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="break-words font-extrabold text-slate-900 dark:text-white">
                                                        {order.orderNumber || '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                        Order #{order.id}
                                                    </p>
                                                </div>
                                            </div>

                                            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-[10px] font-extrabold ${status.badge}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                                                {status.label}
                                            </span>
                                        </div>

                                        <div className="mt-5 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Truck size={15} className="shrink-0 text-slate-400" />
                                                <span className="break-words text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {order.supplierName || '—'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-3">
                                                <span className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                    <CalendarDays size={14} />
                                                    {formatDate(order.orderDate)}
                                                </span>

                                                <span className="flex items-center gap-1 font-extrabold tabular-nums text-slate-900 dark:text-white">
                                                    <IndianRupee size={14} className="text-slate-400" />
                                                    {formatAmount(order.totalAmount)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                                            <button
                                                type="button"
                                                onClick={() => openOrder(order)}
                                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                                            >
                                                <Eye size={15} />
                                                View details
                                            </button>

                                            {isAdmin && order.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusUpdate(order.id, 'APPROVED')
                                                        }
                                                        title="Approve order"
                                                        aria-label={`Approve order ${order.orderNumber || order.id}`}
                                                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                                                    >
                                                        <CheckCircle size={17} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleStatusUpdate(order.id, 'REJECTED')
                                                        }
                                                        title="Reject order"
                                                        aria-label={`Reject order ${order.orderNumber || order.id}`}
                                                        className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                                    >
                                                        <XCircle size={17} />
                                                    </button>
                                                </>
                                            )}

                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDeleteOpen(true);
                                                    }}
                                                    title="Delete order"
                                                    aria-label={`Delete order ${order.orderNumber || order.id}`}
                                                    className="rounded-xl border border-slate-200 p-2.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Showing{' '}
                            <strong className="text-slate-600 dark:text-slate-300">
                                {loading ? '—' : filteredOrders.length}
                            </strong>{' '}
                            of{' '}
                            <strong className="text-slate-600 dark:text-slate-300">
                                {loading ? '—' : orders.length}
                            </strong>{' '}
                            orders
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck size={13} />
                            {isAdmin
                                ? 'Admin approval controls enabled'
                                : 'Pharmacist order tracking'}
                        </span>
                    </div>
                </section>
            </div>

            {/* Existing modals and API operations preserved */}
            <GeneratePOModal
                isOpen={isGenOpen}
                onClose={() => setIsGenOpen(false)}
                onSave={async (data) => {
                    try {
                        await adminService.createPurchaseOrder(data);
                        setIsGenOpen(false);
                        await fetchOrders();
                    } catch (err) {
                        alert('Error: ' + err.message);
                    }
                }}
            />

            <ViewPOModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                order={selectedOrder}
            />

            <DeletePOModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                order={selectedOrder}
                onConfirm={handleDelete}
            />
        </div>
    );
};
