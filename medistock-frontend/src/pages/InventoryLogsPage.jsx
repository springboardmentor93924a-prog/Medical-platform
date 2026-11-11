import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Search, RefreshCw, Calendar, FileText, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function InventoryLogsPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('ALL'); // ALL, IN, OUT

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await adminService.getStockLogs ? await adminService.getStockLogs() : [];
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLogs(); }, []);

    // Filtering logic
    const filteredLogs = logs.filter(l => {
        const matchesSearch = 
            l.medicine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.medicine?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.performedBy?.toLowerCase().includes(searchTerm.toLowerCase());
            
        if (!matchesSearch) return false;

        if (actionFilter === 'IN') return l.changeAmount > 0;
        if (actionFilter === 'OUT') return l.changeAmount < 0;
        return true;
    });

    return (
        <div className="p-8 max-w-[1500px] mx-auto space-y-6 bg-slate-50 min-h-screen">
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>

            {/* Filter Bar */}
            <div className="flex gap-3 mb-6">
                <div className="flex-1 flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search movements by medicine name, code, batch number or user..." 
                        className="w-full text-sm outline-none bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <select 
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 font-medium shadow-sm outline-none cursor-pointer"
                >
                    <option value="ALL">All Actions</option>
                    <option value="IN">Stock IN (+)</option>
                    <option value="OUT">Stock OUT (-)</option>
                </select>

                <button onClick={fetchLogs} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Sync Logs
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">Timestamp</th>
                            <th className="px-6 py-4">Medicine</th>
                            <th className="px-6 py-4">Batch Number</th>
                            <th className="px-6 py-4">Action Type</th>
                            <th className="px-6 py-4">Quantity</th>
                            <th className="px-6 py-4">Actioned By</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredLogs.length === 0 ? (
                            <tr><td colSpan="6" className="py-12 text-center text-slate-500">No stock logs recorded yet.</td></tr>
                        ) : filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 flex items-center gap-2 text-slate-500">
                                    <Calendar size={14} className="text-blue-400" />
                                    {new Date(log.timestamp).toLocaleString('en-GB', { 
                                        day: '2-digit', month: '2-digit', year: 'numeric', 
                                        hour: '2-digit', minute: '2-digit', hour12: true 
                                    })}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-50 text-blue-600 font-bold px-2.5 py-1 rounded-md text-xs">
                                        {log.medicine?.name || 'N/A'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                                    <FileText size={14} className="text-slate-400" /> {log.medicine?.batchNumber || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                        log.changeAmount > 0 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {log.changeAmount > 0 ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                                        {log.changeAmount > 0 ? 'STOCK IN' : 'STOCK OUT'}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 font-bold ${log.changeAmount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {log.changeAmount > 0 ? '+' : ''}{log.changeAmount} units
                                </td>
                                <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                                    <User size={14} className="text-slate-400" /> {log.performedBy || 'Admin'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}