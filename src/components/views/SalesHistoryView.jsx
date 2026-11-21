import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, FileText } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const SalesHistoryView = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchSales = async () => {
        try {
            setLoading(true);
            const data = await adminService.getSalesHistory();
            if (Array.isArray(data)) {
                setSales(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSales(); }, []);

    // Search filter (by Invoice No, Customer Name, or Phone)
    const filteredSales = sales.filter(s => 
        s.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        s.customerPhone?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Sales History</h1>
                    <p className="text-sm text-slate-500">View completed transactions, invoice receipts, and pharmacist audit trails.</p>
                </div>
                <button 
                    onClick={fetchSales}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-sm"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-3 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by invoice #, customer name, phone, or staff..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-100 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Invoice No</th>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Sold By</th>
                            <th className="px-6 py-4">Pay Mode</th>
                            <th className="px-6 py-4 text-right">Total Paid</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading transactions...</td></tr>
                        ) : filteredSales.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-400">No transactions found.</td></tr>
                        ) : (
                            filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold">
                                            <FileText size={16} /> {sale.invoiceNumber}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(sale.saleDate).toLocaleString('en-US', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                            hour: 'numeric', minute: '2-digit', hour12: true
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {/* If no name, show phone. If both, show both */}
                                        {sale.customerName || sale.customerPhone || 'Walk-in Customer'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {/* Placeholder for 'Sold By' - we can add this to the backend later */}
                                        Admin
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                                            sale.paymentMethod === 'CASH' ? 'bg-amber-50 text-amber-600' :
                                            sale.paymentMethod === 'UPI' ? 'bg-blue-50 text-blue-600' :
                                            'bg-purple-50 text-purple-600'
                                        }`}>
                                            {sale.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-emerald-600 font-bold text-base">
                                            ₹{sale.grandTotal?.toFixed(2)}
                                        </div>
                                        {sale.discountAmount > 0 && (
                                            <div className="text-[10px] text-slate-400">
                                                Disc: -₹{sale.discountAmount.toFixed(2)}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};