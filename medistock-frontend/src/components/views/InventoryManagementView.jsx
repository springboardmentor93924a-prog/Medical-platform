import React, { useState, useMemo } from 'react';
import { 
    Search, 
    Filter, 
    Plus, 
    Pill, 
    Edit2, 
    Trash2, 
    ArrowUpDown, 
    Download,
    Minus,
    PlusCircle,
    PackageOpen
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';

export const InventoryManagementView = ({
    medicines = [],
    suppliers = [],
    onOpenAddModal,
    onEditMedicine,
    onDeleteMedicine,
    onAdjustStock
}) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [sortField, setSortField] = useState('name');
    const [sortAsc, setSortAsc] = useState(true);

    const categories = [
        'ALL',
        'Antibiotics',
        'Cardiovascular',
        'Endocrinology / Biologics',
        'Emergency / Anaphylaxis',
        'Anesthesia / Critical Care',
        'Vaccines / Immunology'
    ];

    const filteredMedicines = useMemo(() => {
        return medicines
            .filter(item => {
                const term = searchTerm.toLowerCase();
                const matchesSearch = 
                    item.name?.toLowerCase().includes(term) ||
                    item.genericName?.toLowerCase().includes(term) ||
                    item.batchNumber?.toLowerCase().includes(term) ||
                    item.ndc?.toLowerCase().includes(term);
                
                const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
                const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;

                return matchesSearch && matchesCategory && matchesStatus;
            })
            .sort((a, b) => {
                let valA = a[sortField];
                let valB = b[sortField];

                if (sortField === 'quantity' || sortField === 'unitPrice') {
                    valA = Number(valA) || 0;
                    valB = Number(valB) || 0;
                } else {
                    valA = (valA || '').toString().toLowerCase();
                    valB = (valB || '').toString().toLowerCase();
                }

                if (valA < valB) return sortAsc ? -1 : 1;
                if (valA > valB) return sortAsc ? 1 : -1;
                return 0;
            });
    }, [medicines, searchTerm, selectedCategory, selectedStatus, sortField, sortAsc]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    const handleExportCSV = () => {
        if (filteredMedicines.length === 0) {
            showToast('Formulary is empty. Nothing to export.', 'info');
            return;
        }
        const rows = filteredMedicines.map(m => ({
            ID: m.id,
            Product: m.name,
            Generic: m.genericName,
            NDC: m.ndc,
            Category: m.category,
            DosageForm: m.dosageForm,
            Quantity: m.quantity,
            MinQuantity: m.minQuantity,
            UnitPriceUSD: m.unitPrice,
            Batch: m.batchNumber,
            ExpiryDate: m.expiryDate,
            Storage: m.storageCondition,
            Supplier: m.supplierName,
            Status: m.status
        }));
        reportService.exportToCSV(`medistock_formulary_${new Date().toISOString().split('T')[0]}.csv`, rows);
        showToast(`Exported ${rows.length} formulary rows to CSV`, 'success');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12 bg-white text-slate-900">
            {/* View Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Pill className="text-emerald-600" size={26} />
                        <span>Formulary & Pharmaceutical Inventory</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Comprehensive registry of certified pharmaceuticals, NDC barcoding, batch lots, and inventory levels.
                    </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <button
                        onClick={handleExportCSV}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Download size={15} />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={onOpenAddModal}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={16} />
                        <span>Register Product</span>
                    </button>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Search by drug name, active ingredient, batch number, or NDC barcode..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="IN_STOCK">In Stock</option>
                            <option value="LOW_STOCK">Low Stock</option>
                            <option value="EXPIRING_SOON">Expiring Soon</option>
                            <option value="OUT_OF_STOCK">Out of Stock</option>
                        </select>
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <span className="text-slate-400 text-[11px] font-semibold shrink-0 uppercase tracking-wider flex items-center gap-1">
                        <Filter size={12} /> Class:
                    </span>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1 rounded-lg shrink-0 font-medium transition-all cursor-pointer ${
                                selectedCategory === cat
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold'
                                    : 'text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Inventory Table */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[720px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th 
                                    className="p-4 cursor-pointer hover:text-slate-800 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Product & Formulation</span>
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="p-4">NDC & Lot Batch</th>
                                <th 
                                    className="p-4 cursor-pointer hover:text-slate-800 transition-colors"
                                    onClick={() => handleSort('quantity')}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Current Stock</span>
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th 
                                    className="p-4 cursor-pointer hover:text-slate-800 transition-colors"
                                    onClick={() => handleSort('expiryDate')}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Expiry Date</span>
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="p-4">Storage Condition</th>
                                <th 
                                    className="p-4 cursor-pointer hover:text-slate-800 transition-colors"
                                    onClick={() => handleSort('unitPrice')}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>Unit Price</span>
                                        <ArrowUpDown size={12} />
                                    </div>
                                </th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {filteredMedicines.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                            {item.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {item.genericName} • <span className="text-slate-700 font-medium">{item.strength}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 font-mono text-[11px]">
                                        <div className="text-slate-800 font-semibold">{item.ndc}</div>
                                        <div className="text-slate-400 mt-0.5 text-[10px]">Lot: {item.batchNumber}</div>
                                    </td>

                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onAdjustStock(item.id, -1, 'Dispensed')}
                                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                                title="Dispense 1 unit"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-bold text-sm text-slate-900 min-w-[28px] text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => onAdjustStock(item.id, 1, 'Inbound intake')}
                                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                                                title="Intake 1 unit"
                                            >
                                                <PlusCircle size={12} />
                                            </button>
                                            <span className="text-[11px] text-slate-500">
                                                {item.unit}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            Min: {item.minQuantity}
                                        </div>
                                    </td>

                                    <td className="p-4 font-mono text-[11px] text-slate-700">
                                        {item.expiryDate}
                                    </td>

                                    <td className="p-4 text-[11px] text-slate-600">
                                        {item.storageCondition}
                                    </td>

                                    <td className="p-4 font-bold text-slate-900">
                                        ${Number(item.unitPrice).toFixed(2)}
                                    </td>

                                    <td className="p-4">
                                        <StatusBadge status={item.status} />
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button
                                                onClick={() => onEditMedicine(item)}
                                                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                                title="Edit record"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDeleteMedicine(item)}
                                                className="p-2 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                                title="Decommission item"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {filteredMedicines.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="p-12 text-center">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <PackageOpen size={36} className="mx-auto text-slate-300" />
                                            <p className="text-sm font-bold text-slate-800">No medicines in inventory</p>
                                            <p className="text-xs text-slate-500">All data is cleared. Register your first pharmaceutical to start managing stock.</p>
                                            <button
                                                onClick={onOpenAddModal}
                                                className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Plus size={14} />
                                                <span>Register Product</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>Showing {filteredMedicines.length} registered products</span>
                    <span className="font-mono text-[11px]">Pharmacopeia Revision 2026.4</span>
                </div>
            </div>
        </div>
    );
};
