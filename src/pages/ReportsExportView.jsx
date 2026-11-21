import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, AlertTriangle, ShoppingCart, Download, Printer, Server } from 'lucide-react';

export default function ReportsExportView({ medicines = [], auditLogs = [], orders = [] }) {
    
    // 1. Full Inventory Export
    const exportInventoryCSV = () => {
        const rows = medicines.map(m => `${m.name},${m.category},${m.quantity},${m.unitPrice}`);
        const blob = new Blob([`Name,Category,Qty,Price\n${rows.join('\n')}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'Inventory.csv'; a.click();
    };

    const exportInventoryPDF = () => {
        const doc = new jsPDF();
        doc.text("Full Inventory Audit", 14, 15);
        const rows = medicines.map(m => [m.name, m.category, m.quantity, `₹${m.unitPrice}`]);
        autoTable(doc, { head: [['Name', 'Category', 'Stock', 'Price']], body: rows, startY: 20 });
        doc.save("Inventory.pdf");
    };

    // 2. Low Stock Export
    const exportLowStockCSV = () => {
        const lowStock = medicines.filter(m => m.status === 'LOW_STOCK' || m.status === 'OUT_OF_STOCK');
        const rows = lowStock.map(m => `${m.name},${m.quantity},${m.minQuantity}`);
        const blob = new Blob([`Name,Current Qty,Min Qty\n${rows.join('\n')}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'LowStock.csv'; a.click();
    };

    // 3. Expiry Export
    const exportExpiryCSV = () => {
        const expiring = medicines.filter(m => m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED');
        const rows = expiring.map(m => `${m.name},${m.batchNumber},${m.expiryDate}`);
        const blob = new Blob([`Name,Batch,Expiry\n${rows.join('\n')}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'ExpiryRisk.csv'; a.click();
    };

    // 4. Purchase Orders Export
    const exportPOsCSV = () => {
        const rows = orders.map(o => `${o.orderNumber},${o.supplier?.name},${o.status}`);
        const blob = new Blob([`PO Number,Supplier,Status\n${rows.join('\n')}`], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'PurchaseOrders.csv'; a.click();
    };

    return (
        <div className="p-8 max-w-[1500px] mx-auto space-y-6 bg-slate-100 min-h-screen">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="text-blue-600" size={24} /> Reports & Analytical Export Center
                </h1>
                <p className="text-sm text-slate-500">Generate, download CSV, and print PDF inventory compliance reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Core Audit */}
                <div className="bg-white border border-slate-300 shadow-lg rounded-2xl p-6 relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Server size={24} /></div>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">CORE AUDIT</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Full Inventory Telemetry & Asset Report</h3>
                    <p className="text-sm text-slate-600 mb-6">Comprehensive audit of total medicines, catalogue valuation, available stock, and supplier counts.</p>
                    
                    <div className="flex gap-2">
                        <button onClick={exportInventoryCSV} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2 rounded-xl flex items-center justify-center gap-2">
                            <Download size={16} /> Download CSV
                        </button>
                        <button onClick={exportInventoryPDF} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm px-4 py-2 rounded-xl flex items-center justify-center gap-2">
                            <Printer size={16} /> Print PDF
                        </button>
                    </div>
                </div>

                {/* 2. Low Stock */}
                <div className="bg-white border border-slate-300 shadow-lg rounded-2xl p-6 ">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl"><AlertTriangle size={24} /></div>
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTION REQUIRED</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Low Stock & Restock Priority Audit</h3>
                    <p className="text-sm text-slate-600 mb-6">Detailed watchlist of items reaching or falling below safety reorder levels.</p>
                    
                    <div className="flex gap-2">
                        <button onClick={exportLowStockCSV} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2 rounded-xl flex items-center justify-center gap-2">
                            <Download size={16} /> Download CSV
                        </button>
                    </div>
                </div>

                {/* 3. Expiry Risk */}
                <div className="bg-white border border-slate-300 shadow-lg rounded-2xl p-6 ">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><AlertTriangle size={24} /></div>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-full">RISK AUDIT</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Expiry Risk & Shelf-Life Telemetry Report</h3>
                    <p className="text-sm text-slate-600 mb-6">Complete breakdown of medicines expiring within 30, 60, 90 days, or already expired.</p>
                    
                    <div className="flex gap-2">
                        <button onClick={exportExpiryCSV} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2 rounded-xl flex items-center justify-center gap-2">
                            <Download size={16} /> Download CSV
                        </button>
                    </div>
                </div>

                {/* 4. Procurement */}
                <div className="bg-white border border-slate-300 shadow-lg rounded-2xl p-6 ">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><ShoppingCart size={24} /></div>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-full">PROCUREMENT</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Purchase Orders & Supplier History Report</h3>
                    <p className="text-sm text-slate-600 mb-6">Detailed transaction logs of all purchase orders placed with suppliers and delivery statuses.</p>
                    
                    <div className="flex gap-2">
                        <button onClick={exportPOsCSV} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm py-2 rounded-xl flex items-center justify-center gap-2">
                            <Download size={16} /> Download CSV
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}