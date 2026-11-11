import React, { useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    FileText,
    AlertTriangle,
    ShoppingCart,
    Download,
    Printer,
    Server,
    Search,
    Package,
    PackageX,
    Clock3,
    ClipboardCheck,
    ArrowDownToLine,
    ShieldCheck,
    RefreshCw,
    SearchX,
    ChevronRight,
    FileSpreadsheet,
    ChartNoAxesCombined,
    Pill,
    CalendarClock,
    CheckCircle2,
    Filter,
    X
} from 'lucide-react';

export default function ReportsExportView({
    medicines = [],
    auditLogs = [],
    orders = []
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');

    // 1. Full Inventory Export
    const exportInventoryCSV = () => {
        const rows = medicines.map(m => `${m.name},${m.category},${m.quantity},${m.unitPrice}`);
        const blob = new Blob([`Name,Category,Qty,Price\n${rows.join('\n')}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Inventory.csv';
        a.click();
    };

    const exportInventoryPDF = () => {
        const doc = new jsPDF();
        doc.text('Full Inventory Audit', 14, 15);
        const rows = medicines.map(m => [m.name, m.category, m.quantity, `₹${m.unitPrice}`]);
        autoTable(doc, {
            head: [['Name', 'Category', 'Stock', 'Price']],
            body: rows,
            startY: 20
        });
        doc.save('Inventory.pdf');
    };

    // 2. Low Stock Export
    const exportLowStockCSV = () => {
        const lowStock = medicines.filter(
            m => m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK'
        );
        const rows = lowStock.map(m => `${m.name},${m.quantity},${m.minQuantity}`);
        const blob = new Blob(
            [`Name,Current Qty,Min Qty\n${rows.join('\n')}`],
            { type: 'text/csv' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'LowStock.csv';
        a.click();
    };

    // 3. Expiry Export
    const exportExpiryCSV = () => {
        const expiring = medicines.filter(
            m => m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED'
        );
        const rows = expiring.map(m => `${m.name},${m.batchNumber},${m.expiryDate}`);
        const blob = new Blob(
            [`Name,Batch,Expiry\n${rows.join('\n')}`],
            { type: 'text/csv' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ExpiryRisk.csv';
        a.click();
    };

    // 4. Purchase Orders Export
    const exportPOsCSV = () => {
        const rows = orders.map(o => `${o.orderNumber},${o.supplier?.name},${o.status}`);
        const blob = new Blob(
            [`PO Number,Supplier,Status\n${rows.join('\n')}`],
            { type: 'text/csv' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'PurchaseOrders.csv';
        a.click();
    };

    // Summary values use the same status conditions as the existing exports.
    const lowStockCount = medicines.filter(
        m => m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK'
    ).length;

    const expiryCount = medicines.filter(
        m => m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED'
    ).length;

    const expiredCount = medicines.filter(m => m.status === 'EXPIRED').length;

    const reportCards = [
        {
            id: 'inventory',
            category: 'INVENTORY',
            eyebrow: 'CORE AUDIT',
            title: 'Full Inventory Report',
            description:
                'Export the complete medicine catalogue, categories, available quantities and unit prices.',
            detail: 'Complete medicine catalogue',
            count: medicines.length,
            countLabel: 'medicines',
            icon: Server,
            iconStyle: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
            badgeStyle: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
            accent: 'from-blue-500/10 via-transparent to-transparent',
            csvAction: exportInventoryCSV,
            pdfAction: exportInventoryPDF,
            fileName: 'Inventory'
        },
        {
            id: 'stock',
            category: 'STOCK',
            eyebrow: 'ACTION REQUIRED',
            title: 'Low Stock & Restock Report',
            description:
                'Identify medicines marked low stock or out of stock for faster replenishment planning.',
            detail: 'Items needing attention',
            count: lowStockCount,
            countLabel: 'items',
            icon: AlertTriangle,
            iconStyle: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
            badgeStyle: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
            accent: 'from-amber-500/10 via-transparent to-transparent',
            csvAction: exportLowStockCSV,
            fileName: 'LowStock'
        },
        {
            id: 'expiry',
            category: 'EXPIRY',
            eyebrow: 'RISK MONITORING',
            title: 'Expiry Risk Report',
            description:
                'Review medicines marked expiring soon or expired to help prioritize stock checks.',
            detail: 'Expiry-risk items',
            count: expiryCount,
            countLabel: 'items',
            icon: CalendarClock,
            iconStyle: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
            badgeStyle: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
            accent: 'from-rose-500/10 via-transparent to-transparent',
            csvAction: exportExpiryCSV,
            fileName: 'ExpiryRisk'
        },
        {
            id: 'procurement',
            category: 'PROCUREMENT',
            eyebrow: 'ORDER MANAGEMENT',
            title: 'Purchase Orders Report',
            description:
                'Export purchase order numbers, supplier names and current order statuses.',
            detail: 'Purchase order records',
            count: orders.length,
            countLabel: 'orders',
            icon: ShoppingCart,
            iconStyle: 'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
            badgeStyle: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
            accent: 'from-violet-500/10 via-transparent to-transparent',
            csvAction: exportPOsCSV,
            fileName: 'PurchaseOrders'
        }
    ];

    const filterOptions = [
        { value: 'ALL', label: 'All reports' },
        { value: 'INVENTORY', label: 'Inventory' },
        { value: 'STOCK', label: 'Low stock' },
        { value: 'EXPIRY', label: 'Expiry risk' },
        { value: 'PROCUREMENT', label: 'Procurement' }
    ];

    const filteredReports = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return reportCards.filter(report => {
            const matchesFilter =
                activeFilter === 'ALL' || report.category === activeFilter;

            const matchesSearch =
                !query ||
                report.title.toLowerCase().includes(query) ||
                report.description.toLowerCase().includes(query) ||
                report.eyebrow.toLowerCase().includes(query) ||
                report.fileName.toLowerCase().includes(query);

            return matchesFilter && matchesSearch;
        });
    }, [searchTerm, activeFilter, medicines, orders]);

    const clearFilters = () => {
        setSearchTerm('');
        setActiveFilter('ALL');
    };

    const summaryCards = [
        {
            label: 'Total medicines',
            value: medicines.length,
            note: 'Across the catalogue',
            icon: Pill,
            iconStyle: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
        },
        {
            label: 'Low / out of stock',
            value: lowStockCount,
            note: 'Restock monitoring',
            icon: PackageX,
            iconStyle: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
        },
        {
            label: 'Expiry-risk items',
            value: expiryCount,
            note: `${expiredCount} marked expired`,
            icon: Clock3,
            iconStyle: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
        },
        {
            label: 'Purchase orders',
            value: orders.length,
            note: 'Order records available',
            icon: ShoppingCart,
            iconStyle: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1600px] space-y-7">

                {/* Page header */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7 lg:p-8">
                    <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

                    <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
                        <div className="max-w-3xl">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                <ChartNoAxesCombined size={14} />
                                Reports & analytics
                            </div>

                            <h1 className="flex flex-wrap items-center gap-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl lg:text-4xl">
                                <span>Export Center</span>
                                <span className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    <FileText size={25} />
                                </span>
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400 sm:text-base">
                                Generate and download inventory, stock, expiry and procurement reports
                                from one organized workspace.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                                    <FileSpreadsheet size={15} className="text-emerald-600 dark:text-emerald-400" />
                                    CSV exports
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                                    <Printer size={15} className="text-blue-600 dark:text-blue-400" />
                                    PDF export
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                                    <ShieldCheck size={15} className="text-violet-600 dark:text-violet-400" />
                                    Data-driven reports
                                </span>
                            </div>
                        </div>

                        <div className="relative flex shrink-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 xl:min-w-64">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <ClipboardCheck size={23} />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    Available reports
                                </p>
                                <p className="mt-0.5 text-2xl font-extrabold text-slate-900 dark:text-white">
                                    {reportCards.length}
                                    <span className="ml-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                                        report types
                                    </span>
                                </p>
                            </div>
                            <CheckCircle2 size={18} className="ml-auto self-start text-emerald-500" />
                        </div>
                    </div>
                </section>

                {/* Summary cards */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {summaryCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.label}
                                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                            {item.label}
                                        </p>
                                        <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                            {item.value.toLocaleString('en-IN')}
                                        </p>
                                    </div>

                                    <div className={`rounded-xl p-3 transition-transform duration-200 group-hover:scale-105 ${item.iconStyle}`}>
                                        <Icon size={22} />
                                    </div>
                                </div>

                                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.note}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </section>

                {/* Report browser */}
                <section className="space-y-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Report library
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Choose a report and export the data you need.
                            </p>
                        </div>

                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                            <FileText size={14} />
                            {filteredReports.length} of {reportCards.length} reports
                        </span>
                    </div>

                    {/* Search and filters */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="relative w-full xl:max-w-md">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search reports by name or category..."
                                    aria-label="Search reports"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-blue-400"
                                />

                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        aria-label="Clear search"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Filter size={15} />
                                    Filter
                                </span>

                                {filterOptions.map((option) => {
                                    const isActive = activeFilter === option.value;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setActiveFilter(option.value)}
                                            className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                                    : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Report cards */}
                    {filteredReports.length > 0 ? (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                            {filteredReports.map((report) => {
                                const Icon = report.icon;

                                return (
                                    <article
                                        key={report.id}
                                        className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                                    >
                                        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${report.accent} opacity-70`} />

                                        <div className="relative flex flex-1 flex-col p-5 sm:p-6">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105 ${report.iconStyle}`}>
                                                    <Icon size={23} />
                                                </div>

                                                <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold tracking-wider ${report.badgeStyle}`}>
                                                    {report.eyebrow}
                                                </span>
                                            </div>

                                            <div className="mt-5">
                                                <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
                                                    {report.title}
                                                </h3>
                                                <p className="mt-2 min-h-[60px] text-sm leading-6 text-slate-600 dark:text-slate-400">
                                                    {report.description}
                                                </p>
                                            </div>

                                            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="rounded-lg bg-white p-2 text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                                                        <Package size={17} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                                                            {report.detail}
                                                        </p>
                                                        <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                                                            {report.count.toLocaleString('en-IN')} {report.countLabel}
                                                        </p>
                                                    </div>
                                                </div>

                                                <ChevronRight
                                                    size={17}
                                                    className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500"
                                                />
                                            </div>

                                            <div className="mt-auto flex flex-col gap-2.5 pt-5 sm:flex-row">
                                                <button
                                                    type="button"
                                                    onClick={report.csvAction}
                                                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-[0.98]"
                                                >
                                                    <Download size={16} />
                                                    Export CSV
                                                    <ArrowDownToLine size={14} className="opacity-75" />
                                                </button>

                                                {report.pdfAction ? (
                                                    <button
                                                        type="button"
                                                        onClick={report.pdfAction}
                                                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                                                    >
                                                        <Printer size={16} />
                                                        PDF
                                                    </button>
                                                ) : (
                                                    <div className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                                                        <FileSpreadsheet size={16} />
                                                        CSV format
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="relative h-1 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <div className="h-full w-0 bg-blue-500 transition-all duration-500 group-hover:w-full" />
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                <SearchX size={26} />
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                                No reports found
                            </h3>
                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Try another search term or change your selected report category.
                            </p>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                            >
                                <RefreshCw size={15} />
                                Reset filters
                            </button>
                        </div>
                    )}
                </section>

                {/* Footer note */}
                <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <ShieldCheck size={19} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Report export information
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                Exports use the medicine and purchase-order data currently supplied to this page.
                                The report filters organize the available report cards; they do not modify your records.
                            </p>
                        </div>
                    </div>

                    <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <CheckCircle2 size={15} className="text-emerald-500" />
                        Ready to export
                    </span>
                </footer>
            </div>
        </div>
    );
}
