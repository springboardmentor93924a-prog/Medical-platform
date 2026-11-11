import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Pill,
    ChevronRight,
    ArrowLeft,
    Tags,
    Package,
    Layers3,
    ShieldCheck,
    FolderOpen,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    ClipboardList,
    SearchX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CategoriesPage() {
    const { user } = useAuth();
    const role = (user?.role || 'ADMIN').toUpperCase();
    const isAdmin = role === 'ADMIN';

    const [categories, setCategories] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Existing pharmacist category selection logic
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchData = async () => {
        try {
            const [catData, medData] = await Promise.all([
                adminService.getAllCategories(),
                adminService.getAllMedicines(),
            ]);

            setCategories(catData);
            setMedicines(medData);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);

        try {
            await adminService.createCategory(formData);
            setIsModalOpen(false);
            setFormData({ name: '', description: '' });
            await fetchData();
        } catch (err) {
            alert('Failed to save category');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;

        try {
            await adminService.deleteCategory(id);
            await fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete category');
        }
    };

    const filtered = categories.filter(
        (c) =>
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryMedicineCount = (categoryName) =>
        medicines.filter((m) => m.category === categoryName).length;

    const getCategoryStock = (categoryName) =>
        medicines
            .filter((m) => m.category === categoryName)
            .reduce((total, medicine) => total + (Number(medicine.quantity) || 0), 0);

    const getStockStatus = (status) => {
        if (status === 'OUT_OF_STOCK') {
            return {
                label: 'Out of stock',
                className:
                    'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20',
                icon: AlertCircle,
            };
        }

        if (status === 'LOW_STOCK') {
            return {
                label: 'Low stock',
                className:
                    'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
                icon: AlertCircle,
            };
        }

        return {
            label: status || 'In stock',
            className:
                'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
            icon: CheckCircle2,
        };
    };

    const closeModal = () => {
        if (isSaving) return;
        setIsModalOpen(false);
        setFormData({ name: '', description: '' });
    };

    // Pharmacist view: medicines inside the selected category
    if (selectedCategory) {
        const catMeds = medicines.filter(
            (m) => m.category === selectedCategory.name
        );

        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8 lg:py-8">
                <div className="mx-auto max-w-[1400px] space-y-6">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-400"
                    >
                        <ArrowLeft
                            size={16}
                            className="transition-transform group-hover:-translate-x-0.5"
                        />
                        Back to Categories
                    </button>

                    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                                    <Tags size={26} />
                                </div>

                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
                                        Category inventory
                                    </p>
                                    <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                        {selectedCategory.name}
                                    </h1>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                                        {catMeds.length} {catMeds.length === 1 ? 'medicine' : 'medicines'} in this category
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 px-4 py-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Total stock
                                    </p>
                                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">
                                        {catMeds.reduce(
                                            (total, medicine) =>
                                                total + (Number(medicine.quantity) || 0),
                                            0
                                        ).toLocaleString()}
                                        <span className="ml-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                            units
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white">
                                    Medicine inventory
                                </h2>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Stock and batch information for this category
                                </p>
                            </div>
                            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {catMeds.length} records
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-left text-sm">
                                <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Medicine</th>
                                        <th className="px-6 py-4">Batch number</th>
                                        <th className="px-6 py-4">Available stock</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {catMeds.map((m) => {
                                        const stock = getStockStatus(m.status);
                                        const StockIcon = stock.icon;

                                        return (
                                            <tr
                                                key={m.id}
                                                className="transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                            <Pill size={19} />
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-slate-100">
                                                            {m.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        {m.batchNumber || '—'}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">
                                                        {Number(m.quantity) || 0}
                                                    </span>
                                                    <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                                                        units
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${stock.className}`}>
                                                        <StockIcon size={13} />
                                                        {stock.label.replaceAll('_', ' ')}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {catMeds.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-16 text-center">
                                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                    <FolderOpen size={25} />
                                                </div>
                                                <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
                                                    No medicines found
                                                </p>
                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    There are currently no medicines in this category.
                                                </p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    // Default view: category list
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-800 transition-colors duration-300 dark:bg-[#0b1120] dark:text-slate-100 sm:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-[1400px] space-y-7">
                {/* Page heading */}
                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                    <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 right-1/4 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-600/20">
                                <Tags size={27} />
                            </div>

                            <div>
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                        {isAdmin ? 'Administration' : 'Inventory workspace'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                        <ShieldCheck size={13} />
                                        Role-based access
                                    </span>
                                </div>

                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    Categories
                                </h1>

                                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {isAdmin
                                        ? 'Organize medicines into categories and keep your inventory structured.'
                                        : 'Explore medicine categories and view the stock available in each one.'}
                                </p>
                            </div>
                        </div>

                        {(isAdmin || role === 'PHARMACIST') && (
                                 <button
                                    type="button"
                                     onClick={() => setIsModalOpen(true)}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-200 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                            >
                                <Plus size={18} />
                                Add Category
                            </button>
                        )}
                    </div>
                </section>

                {/* Summary cards */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Total categories
                                </p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {categories.length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-400">
                                <Tags size={23} />
                            </div>
                        </div>
                        <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div className="h-full w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                        </div>
                    </div>

                    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Total medicines
                                </p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {medicines.length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition group-hover:scale-105 dark:bg-violet-500/10 dark:text-violet-400">
                                <Pill size={23} />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            Across all inventory records
                        </p>
                    </div>

                    <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Matching results
                                </p>
                                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                    {filtered.length}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:scale-105 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <ClipboardList size={23} />
                            </div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                            {searchTerm ? 'Based on your current search' : 'All available categories'}
                        </p>
                    </div>
                </section>

                {/* Search and list */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                                Category directory
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Search and browse your medicine categories.
                            </p>
                        </div>

                        <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800/70 dark:focus-within:border-blue-500 dark:focus-within:bg-slate-800 lg:max-w-sm">
                            <Search size={17} className="shrink-0 text-slate-400" />
                            <input
                                type="search"
                                placeholder="Search name or description..."
                                aria-label="Search categories by name or description"
                                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Responsive category cards on mobile */}
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5 lg:hidden">
                        {filtered.map((c) => {
                            const medicineCount = getCategoryMedicineCount(c.name);
                            const totalStock = getCategoryStock(c.name);

                            return (
                                <article
                                    key={c.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 dark:from-blue-500/15 dark:to-indigo-500/15 dark:text-blue-300">
                                                <Tags size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-bold text-slate-900 dark:text-white">
                                                    {c.name}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                    Category #{c.id}
                                                </p>
                                            </div>
                                        </div>

                                        {(isAdmin || role === 'PHARMACIST') && (
                                          <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    type="button"
                                                    title="Edit category"
                                                    aria-label={`Edit ${c.name}`}
                                                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(c.id)}
                                                    title="Delete category"
                                                    aria-label={`Delete ${c.name}`}
                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <p className="mt-4 min-h-10 break-words text-sm leading-5 text-slate-500 dark:text-slate-400">
                                        {c.description || 'No description provided.'}
                                    </p>

                                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                                        <div>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Medicines
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {medicineCount}
                                                <span className="ml-1 text-xs font-medium text-slate-400">
                                                    items
                                                </span>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                Total stock
                                            </p>
                                            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                {totalStock.toLocaleString()} units
                                            </p>
                                        </div>
                                    </div>

                                    {!isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategory(c)}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                                        >
                                            View medicines
                                            <ChevronRight size={16} />
                                        </button>
                                    )}
                                </article>
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700">
                                <SearchX size={30} className="mx-auto text-slate-400" />
                                <p className="mt-3 font-bold text-slate-800 dark:text-slate-100">
                                    No categories found
                                </p>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Try another search or clear your search term.
                                </p>
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="mt-4 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Desktop category table */}
                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                                <tr>
                                    <th className="w-24 px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-center">Medicines</th>
                                    <th className="px-6 py-4 text-center">Total stock</th>
                                    <th className="px-6 py-4 text-right">
                                        {isAdmin ? 'Actions' : 'Inventory'}
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filtered.map((c) => {
                                    const medicineCount = getCategoryMedicineCount(c.name);
                                    const totalStock = getCategoryStock(c.name);

                                    return (
                                        <tr
                                            key={c.id}
                                            className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                                        >
                                            <td className="px-6 py-5">
                                                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                    #{c.id}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500/20">
                                                        <Tags size={19} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 dark:text-slate-100">
                                                            {c.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                            Medicine category
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="max-w-sm px-6 py-5">
                                                <p className="line-clamp-2 leading-5 text-slate-500 dark:text-slate-400">
                                                    {c.description || 'No description provided.'}
                                                </p>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <span className="inline-flex min-w-9 items-center justify-center rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-extrabold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                                                    {medicineCount}
                                                </span>
                                            </td>

                                            <td className="px-6 py-5 text-center">
                                                <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
                                                    {totalStock.toLocaleString()}
                                                </span>
                                                <span className="ml-1 text-xs text-slate-400">
                                                    units
                                                </span>
                                            </td>

                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {(isAdmin || role === 'PHARMACIST') ? (
                                                          <>
                                                            <button
                                                                type="button"
                                                                title="Edit category"
                                                                aria-label={`Edit ${c.name}`}
                                                                className="rounded-xl border border-slate-200 bg-white p-2.5 text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(c.id)}
                                                                title="Delete category"
                                                                aria-label={`Delete ${c.name}`}
                                                                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedCategory(c)}
                                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                                                        >
                                                            View inventory
                                                            <ChevronRight size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                                <FolderOpen size={25} />
                                            </div>
                                            <p className="mt-4 font-bold text-slate-800 dark:text-slate-100">
                                                No categories found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {searchTerm
                                                    ? 'Try a different name or description.'
                                                    : 'Add a category to organize your medicine inventory.'}
                                            </p>
                                            {searchTerm && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSearchTerm('')}
                                                    className="mt-4 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                                                >
                                                    <RefreshCw size={14} />
                                                    Reset search
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-3 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Showing <strong className="text-slate-600 dark:text-slate-300">{filtered.length}</strong> of{' '}
                            <strong className="text-slate-600 dark:text-slate-300">{categories.length}</strong> categories
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck size={13} />
                            {isAdmin ? 'Administrator access' : 'Read-only category access'}
                        </span>
                    </div>
                </section>
            </div>

            {/* Add category modal: admin only */}
           {(isAdmin || role === 'PHARMACIST') && isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="add-category-title"
                        className="my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900"
                    >
                        <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-6 py-5 dark:border-slate-800 dark:from-blue-500/10 dark:via-slate-900 dark:to-indigo-500/10 sm:px-7">
                            <div className="pointer-events-none absolute -right-5 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />

                            <div className="relative flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                                        <Tags size={22} />
                                    </div>
                                    <div>
                                        <h3
                                            id="add-category-title"
                                            className="text-lg font-extrabold text-slate-900 dark:text-white"
                                        >
                                            Add new category
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Create a category for your medicine inventory.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSaving}
                                    aria-label="Close dialog"
                                    className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="space-y-5 p-6 sm:p-7">
                            <div>
                                <label
                                    htmlFor="category-name"
                                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                                >
                                    Category name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="category-name"
                                    required
                                    type="text"
                                    maxLength={100}
                                    autoFocus
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    placeholder="e.g. Antibiotics"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                                />
                                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                                    Use a clear name that helps staff identify the category.
                                </p>
                            </div>

                            <div>
                                <label
                                    htmlFor="category-description"
                                    className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200"
                                >
                                    Description
                                    <span className="ml-1 font-medium text-slate-400">
                                        (optional)
                                    </span>
                                </label>
                                <textarea
                                    id="category-description"
                                    rows={4}
                                    maxLength={500}
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            description: e.target.value,
                                        })
                                    }
                                    placeholder="Briefly describe the medicines in this category..."
                                    className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:bg-slate-800"
                                />
                                <p className="mt-1.5 text-right text-[11px] text-slate-400 dark:text-slate-500">
                                    {formData.description.length}/500
                                </p>
                            </div>

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={isSaving}
                                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:min-w-28"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving || !formData.name.trim()}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-40"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Plus size={17} />
                                            Save category
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
