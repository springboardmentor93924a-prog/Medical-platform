import React, { useState } from 'react';
import { 
    FileText, 
    Download, 
    CheckCircle, 
    DollarSign, 
    AlertTriangle, 
    Snowflake, 
    Printer, 
    Table
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';

export const ReportsExportView = ({ medicines = [], suppliers = [], auditLogs = [] }) => {
    const { showToast } = useToast();

    const totalValuation = medicines.reduce((sum, m) => sum + ((Number(m.quantity) || 0) * (Number(m.unitPrice) || 0)), 0);
    const lowStockCount = medicines.filter(m => m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK').length;
    const coldChainCount = medicines.filter(m => m.storageCondition?.toLowerCase().includes('refrigerated')).length;

    const handleExportFullFormulary = () => {
        if (medicines.length === 0) {
            showToast('Formulary is empty. Nothing to export.', 'info');
            return;
        }
        const rows = medicines.map(m => ({
            ID: m.id,
            Product: m.name,
            Generic: m.genericName,
            NDC: m.ndc,
            Category: m.category,
            DosageForm: m.dosageForm,
            Quantity: m.quantity,
            MinQuantity: m.minQuantity,
            UnitPriceUSD: m.unitPrice,
            TotalValueUSD: (m.quantity * m.unitPrice).toFixed(2),
            Batch: m.batchNumber,
            ExpiryDate: m.expiryDate,
            Storage: m.storageCondition,
            Supplier: m.supplierName,
            Status: m.status
        }));
        reportService.exportToCSV(`medistock_full_inventory_${new Date().toISOString().split('T')[0]}.csv`, rows);
        showToast('Exported Full Formulary CSV successfully', 'success');
    };

    const handleExportLowStock = () => {
        const rows = medicines.filter(m => m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK').map(m => ({
            ID: m.id,
            Product: m.name,
            NDC: m.ndc,
            Quantity: m.quantity,
            MinQuantity: m.minQuantity,
            Deficit: Math.max(0, m.minQuantity - m.quantity),
            Supplier: m.supplierName,
            Status: m.status
        }));
        if (rows.length === 0) {
            showToast('No low stock items detected.', 'info');
            return;
        }
        reportService.exportToCSV(`medistock_low_stock_procurement_${new Date().toISOString().split('T')[0]}.csv`, rows);
        showToast(`Exported ${rows.length} low-stock procurement items to CSV`, 'success');
    };

    const handleExportAuditLogs = () => {
        if (auditLogs.length === 0) {
            showToast('Audit log is empty.', 'info');
            return;
        }
        const rows = auditLogs.map(l => ({
            LogID: l.id,
            Timestamp: l.timestamp,
            User: l.userName,
            Role: l.userRole,
            Action: l.action,
            Details: l.details,
            Status: l.status
        }));
        reportService.exportToCSV(`medistock_compliance_audit_${new Date().toISOString().split('T')[0]}.csv`, rows);
        showToast('Exported GxP Compliance Audit Trail to CSV', 'success');
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-12 bg-white text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <FileText className="text-emerald-600" size={26} />
                        <span>Formulary Reports & Compliance Exports</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Download certified GxP audit data, valuation balance sheets, and procurement orders.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Printer size={15} />
                        <span>Print Document</span>
                    </button>
                </div>
            </div>

            {/* Valuation & Audit Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Total Book Valuation</span>
                    <div className="mt-2 text-2xl font-black text-emerald-600">
                        ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{medicines.length} registered pharmaceutical formulations</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Urgent Procurement Deficit</span>
                    <div className="mt-2 text-2xl font-black text-amber-600">{lowStockCount} Products</div>
                    <p className="text-[11px] text-slate-500 mt-1">Below minimum emergency threshold</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Cold-Chain Monitored SKUs</span>
                    <div className="mt-2 text-2xl font-black text-cyan-600">{coldChainCount} Products</div>
                    <p className="text-[11px] text-slate-500 mt-1">Active sensor telemetry verified</p>
                </div>
            </div>

            {/* Export Action Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Full Inventory */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 w-fit mb-3">
                            <Table size={20} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Master Formulary Report</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Complete catalog including NDC codes, active chemical ingredients, dosage forms, unit pricing, and storage racks.
                        </p>
                    </div>
                    <button
                        onClick={handleExportFullFormulary}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Download Formulary CSV</span>
                    </button>
                </div>

                {/* 2. Low Stock */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 w-fit mb-3">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Procurement & Low Stock Order</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Filtered purchase order requisitions calculating unit deficits for Cardinal Health, McKesson, and direct suppliers.
                        </p>
                    </div>
                    <button
                        onClick={handleExportLowStock}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Download Reorder CSV</span>
                    </button>
                </div>

                {/* 3. Audit Trail */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div>
                        <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 border border-cyan-100 w-fit mb-3">
                            <FileText size={20} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">GxP Regulatory Audit Log</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Timestamped trace of all dispensing actions, lot intake records, and pharmacist electronic verifications.
                        </p>
                    </div>
                    <button
                        onClick={handleExportAuditLogs}
                        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Download size={14} />
                        <span>Download Audit Log CSV</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
