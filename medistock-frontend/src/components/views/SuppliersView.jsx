
import React, { useMemo, useState } from 'react';
import {
    Truck,
    Plus,
    Phone,
    Mail,
    MapPin,
    ShieldCheck,
    Trash2,
    Package,
    Pencil,
    Search,
    X,
    Building2,
    Users,
    CheckCircle2,
    ArrowUpRight,
    Boxes,
    Hash
} from 'lucide-react';

export const SuppliersView = ({
    suppliers = [],
    medicines = [],
    onOpenAddSupplier,
    onDeleteSupplier,
    onEditSupplier,
    role
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = role === 'ADMIN';

    const filteredSuppliers = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return suppliers.filter((supplier) => {
            const name = supplier.name || '';
            const contact = supplier.contactPerson || '';
            const license = supplier.licenseNumber || '';
            const email = supplier.email || '';
            const phone = supplier.phone || '';

            return (
                name.toLowerCase().includes(term) ||
                contact.toLowerCase().includes(term) ||
                license.toLowerCase().includes(term) ||
                email.toLowerCase().includes(term) ||
                phone.toLowerCase().includes(term)
            );
        });
    }, [suppliers, searchTerm]);

    const activeCount = suppliers.filter(
        (supplier) =>
            !supplier.status ||
            supplier.status.toLowerCase() === 'active'
    ).length;

    const totalAssignedMedicines = useMemo(() => {
        return new Set(
            medicines
                .filter((medicine) =>
                    suppliers.some(
                        (supplier) => supplier.id == medicine.supplierId
                    )
                )
                .map((medicine) => medicine.id)
        ).size;
    }, [medicines, suppliers]);

    const getSupplierMedicines = (supplier) =>
        medicines.filter(
            (medicine) => medicine.supplierId == supplier.id
        );

    const getInitials = (name = '') =>
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part.charAt(0))
            .join('')
            .toUpperCase() || 'S';

    const isActive = (supplier) =>
        !supplier.status ||
        supplier.status.toLowerCase() === 'active';

    const stats = [
        {
            label: 'Total suppliers',
            value: suppliers.length,
            detail: 'Registered vendors',
            icon: Building2,
            color: 'teal'
        },
        {
            label: 'Active suppliers',
            value: activeCount,
            detail: 'Available partners',
            icon: CheckCircle2,
            color: 'emerald'
        },
        {
            label: 'Medicines assigned',
            value: totalAssignedMedicines,
            detail: 'Unique linked medicines',
            icon: Boxes,
            color: 'blue'
        }
    ];

    const statColors = {
        teal: 'bg-teal-50 text-teal-700 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20',
        emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
        blue: 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20'
    };

    const contactRows = [
        {
            key: 'licenseNumber',
            label: 'License number',
            icon: ShieldCheck,
            format: (value) => value || 'Not provided',
            mono: true
        },
        {
            key: 'email',
            label: 'Email address',
            icon: Mail,
            format: (value) => value || 'Not provided',
            href: (value) => value ? `mailto:${value}` : null
        },
        {
            key: 'phone',
            label: 'Phone number',
            icon: Phone,
            format: (value) => value || 'Not provided',
            href: (value) => value ? `tel:${value}` : null
        },
        {
            key: 'address',
            label: 'Address',
            icon: MapPin,
            format: (value) => value || 'Not provided'
        }
    ];

    return (
        <div className="min-h-full space-y-6 bg-slate-50 p-4 pb-10 transition-colors duration-300 dark:bg-slate-950 sm:p-6 lg:p-8">

            {/* Page header */}
            <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 ring-1 ring-teal-200/70 dark:bg-teal-500/15 dark:text-teal-300 dark:ring-teal-500/20">
                        <Truck size={24} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                Supplier Network
                            </h1>

                            <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:border-teal-500/25 dark:bg-teal-500/10 dark:text-teal-300">
                                {isAdmin ? 'Admin' : 'Directory'}
                            </span>
                        </div>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Manage pharmaceutical suppliers and their inventory relationships.
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={onOpenAddSupplier}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-600/20 transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                    >
                        <Plus size={18} />
                        Add supplier
                    </button>
                )}
            </section>

            {/* Summary cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/30 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {stat.label}
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        {stat.value}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                                        {stat.detail}
                                    </p>
                                </div>

                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${statColors[stat.color]}`}>
                                    <Icon size={21} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Search and result count */}
            <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search suppliers, contact, license, email or phone..."
                            aria-label="Search suppliers"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:bg-slate-800"
                        />

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 px-1 sm:justify-end">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                            <Users size={16} />
                            <span>
                                <strong className="font-bold text-slate-800 dark:text-slate-200">
                                    {filteredSuppliers.length}
                                </strong>{' '}
                                {filteredSuppliers.length === 1 ? 'supplier' : 'suppliers'}
                            </span>
                        </span>

                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="text-xs font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-300 dark:hover:text-teal-200"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Supplier cards */}
            {filteredSuppliers.length > 0 ? (
                <section className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredSuppliers.map((supplier) => {
                        const suppliedMeds = getSupplierMedicines(supplier);
                        const active = isActive(supplier);

                        return (
                            <article
                                key={supplier.id}
                                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg hover:shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-500/40 dark:hover:shadow-black/20"
                            >
                                {/* Card accent */}
                                <div className={`h-1 w-full ${active ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-slate-300 dark:bg-slate-700'}`} />

                                <div className="flex flex-1 flex-col p-5">
                                    {/* Supplier identity */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-base font-bold text-teal-700 ring-1 ring-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20">
                                            {getInitials(supplier.name)}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h2 className="break-words text-base font-bold leading-6 text-slate-900 transition-colors group-hover:text-teal-700 dark:text-white dark:group-hover:text-teal-300">
                                                {supplier.name || 'Unnamed supplier'}
                                            </h2>

                                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${active
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                    {supplier.status || 'Active'}
                                                </span>

                                                <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                                                    <Hash size={12} />
                                                    <span className="truncate">{supplier.id}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {isAdmin && (
                                            <div className="flex shrink-0 items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onEditSupplier?.(supplier)}
                                                    title="Edit supplier"
                                                    aria-label={`Edit ${supplier.name || 'supplier'}`}
                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => onDeleteSupplier?.(supplier)}
                                                    title="Delete supplier"
                                                    aria-label={`Delete ${supplier.name || 'supplier'}`}
                                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact details */}
                                    <div className="mt-5 space-y-3 rounded-xl bg-slate-50/80 p-3.5 dark:bg-slate-800/50">
                                        {contactRows.map((row) => {
                                            const Icon = row.icon;
                                            const value = supplier[row.key];
                                            const displayValue = row.format(value);
                                            const href = row.href?.(value);

                                            return (
                                                <div
                                                    key={row.key}
                                                    className="flex min-w-0 items-start gap-3"
                                                >
                                                    <Icon
                                                        size={15}
                                                        className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500"
                                                    />

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                            {row.label}
                                                        </p>

                                                        {href ? (
                                                            <a
                                                                href={href}
                                                                title={displayValue}
                                                                className={`mt-0.5 block break-words text-xs font-medium text-slate-700 transition hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 ${row.mono ? 'font-mono' : ''}`}
                                                            >
                                                                {displayValue}
                                                            </a>
                                                        ) : (
                                                            <p
                                                                title={displayValue}
                                                                className={`mt-0.5 break-words text-xs font-medium ${value
                                                                    ? 'text-slate-700 dark:text-slate-300'
                                                                    : 'text-slate-400 dark:text-slate-500'
                                                                } ${row.mono ? 'font-mono' : ''}`}
                                                            >
                                                                {displayValue}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Supplied medicines */}
                                    <div className="mt-auto pt-5">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <Package size={15} className="text-teal-600 dark:text-teal-400" />

                                                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    Supplied medicines
                                                </h3>
                                            </div>

                                            <span className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-bold tabular-nums text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                                                {suppliedMeds.length}
                                            </span>
                                        </div>

                                        {suppliedMeds.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {suppliedMeds.slice(0, 3).map((medicine) => (
                                                    <span
                                                        key={medicine.id}
                                                        title={medicine.name}
                                                        className="max-w-full truncate rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                    >
                                                        {medicine.name || 'Unnamed medicine'}
                                                    </span>
                                                ))}

                                                {suppliedMeds.length > 3 && (
                                                    <span className="rounded-lg border border-dashed border-slate-300 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                                                        +{suppliedMeds.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-3 dark:border-slate-700">
                                                <Package size={15} className="text-slate-400" />
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    No medicines assigned yet
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </section>
            ) : (
                /* Empty state */
                <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900 sm:py-16">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300">
                        {searchTerm ? <Search size={25} /> : <Truck size={25} />}
                    </div>

                    <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                        {searchTerm ? 'No matching suppliers' : 'Your supplier network is empty'}
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {searchTerm
                            ? 'Try a different name, contact person, license number, email or phone number.'
                            : 'Registered suppliers will appear here with their contact details and linked medicines.'
                        }
                    </p>

                    {searchTerm ? (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <X size={16} />
                            Clear search
                        </button>
                    ) : isAdmin ? (
                        <button
                            type="button"
                            onClick={onOpenAddSupplier}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                            <Plus size={17} />
                            Add your first supplier
                        </button>
                    ) : null}
                </section>
            )}

            {/* Footer */}
            {filteredSuppliers.length > 0 && (
                <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                    <span>
                        Showing{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-200">
                            {filteredSuppliers.length}
                        </strong>{' '}
                        of{' '}
                        <strong className="font-semibold text-slate-700 dark:text-slate-200">
                            {suppliers.length}
                        </strong>{' '}
                        suppliers
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-teal-600 dark:text-teal-400" />
                        Supplier directory
                    </span>
                </footer>
            )}
        </div>
    );
};
