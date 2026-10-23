import React, { useState } from 'react';
import { 
    Truck, 
    Plus, 
    Phone, 
    Mail, 
    MapPin, 
    Star, 
    ShieldCheck, 
    Clock, 
    ShoppingCart,
    Trash2,
    PackageOpen
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SuppliersView = ({
    suppliers = [],
    medicines = [],
    onOpenAddSupplier,
    onDeleteSupplier
}) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreatePO = (supplier) => {
        showToast(`Draft Purchase Order generated for ${supplier.name}. Sent to Procurement.`, 'success');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12 bg-white text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Truck className="text-teal-600" size={26} />
                        <span>Certified Pharmaceutical Distributor Network</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        FDA/DEA validated wholesalers, direct manufacturer contracts, delivery SLA telemetry, and purchase orders.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenAddSupplier}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Onboard Distributor</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <input
                    type="text"
                    placeholder="Search by distributor name, contact representative, or license number..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-md px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                />
                <span className="text-xs text-slate-500 font-medium shrink-0">
                    {filteredSuppliers.length} Certified Vendors
                </span>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredSuppliers.map(supplier => {
                    const suppliedMeds = medicines.filter(m => m.supplierId === supplier.id);

                    return (
                        <div
                            key={supplier.id}
                            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm space-y-4 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-base font-bold text-slate-900">{supplier.name}</h2>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                {supplier.status || 'Active'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-amber-600 mt-1 font-semibold">
                                            <Star size={13} fill="currentColor" />
                                            <span>{supplier.rating || 4.9}</span>
                                            <span className="text-slate-400 font-normal">({supplier.totalOrders || 0} orders completed)</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => onDeleteSupplier(supplier)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                        title="Remove vendor"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>

                                <div className="mt-4 space-y-2 text-xs text-slate-600">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                                        <span>License: <strong className="text-slate-800 font-mono">{supplier.licenseNumber}</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Clock size={14} className="text-cyan-600 shrink-0" />
                                        <span>Average SLA: <strong className="text-slate-800">{supplier.leadTimeDays || 2} Days</strong></span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Mail size={14} className="text-slate-400 shrink-0" />
                                        <span className="text-slate-700">{supplier.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Phone size={14} className="text-slate-400 shrink-0" />
                                        <span className="text-slate-700">{supplier.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin size={14} className="text-slate-400 shrink-0" />
                                        <span className="text-slate-600 truncate">{supplier.address}</span>
                                    </div>
                                </div>

                                {/* Contracted formulary products preview */}
                                <div className="mt-4 pt-3 border-t border-slate-100">
                                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                                        Supplied Pharmaceuticals ({suppliedMeds.length})
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {suppliedMeds.slice(0, 3).map(m => (
                                            <span key={m.id} className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                                {m.name.split(' ')[0]}
                                            </span>
                                        ))}
                                        {suppliedMeds.length > 3 && (
                                            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500">
                                                +{suppliedMeds.length - 3} more
                                            </span>
                                        )}
                                        {suppliedMeds.length === 0 && (
                                            <span className="text-[11px] text-slate-400 italic">No assigned items</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 font-mono">ID: {supplier.id}</span>
                                <button
                                    onClick={() => handleCreatePO(supplier)}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-teal-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <ShoppingCart size={13} />
                                    <span>Create Reorder PO</span>
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredSuppliers.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-2">
                        <PackageOpen size={36} className="mx-auto text-slate-300" />
                        <p className="text-sm font-bold text-slate-800">No certified suppliers found</p>
                        <p className="text-xs text-slate-500">Supplier database is empty. Click below to onboard your first pharmaceutical distributor.</p>
                        <button
                            onClick={onOpenAddSupplier}
                            className="mt-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                            <Plus size={14} />
                            <span>Onboard Distributor</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
