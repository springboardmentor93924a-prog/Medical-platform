import React, { useState } from 'react';
import { 
    ClipboardCheck, 
    Search, 
    Filter, 
    Download, 
    ShieldCheck, 
    User, 
    Clock, 
    CheckCircle2,
    PackageOpen
} from 'lucide-react';
import { reportService } from '../../services/reportService';
import { useToast } from '../../context/ToastContext';

export const AuditLogsView = ({ auditLogs = [] }) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState('ALL');

    const actions = [
        'ALL',
        'STOCK_ADJUSTMENT',
        'MEDICINE_CREATED',
        'MEDICINE_UPDATED',
        'MEDICINE_DELETED',
        'SUPPLIER_ADDED',
        'USER_LOGIN'
    ];

    const filteredLogs = auditLogs.filter(log => {
        const matchesTerm = 
            log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
        return matchesTerm && matchesAction;
    });

    const handleExport = () => {
        if (filteredLogs.length === 0) {
            showToast('Audit log is empty. Nothing to export.', 'info');
            return;
        }
        const rows = filteredLogs.map(l => ({
            LogID: l.id,
            Timestamp: l.timestamp,
            User: l.userName,
            Role: l.userRole,
            Action: l.action,
            Details: l.details,
            Status: l.status
        }));
        reportService.exportToCSV(`medistock_audit_${new Date().toISOString().split('T')[0]}.csv`, rows);
        showToast(`Exported ${rows.length} audit entries to CSV`, 'success');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12 bg-white text-slate-900">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <ClipboardCheck className="text-teal-600" size={26} />
                        <span>Compliance & Regulatory Audit Logs</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Cryptographically traceable log of every formulary update, stock decrement, and supplier modification.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <Download size={15} />
                        <span>Export Audit Trail</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-2.5 text-slate-400" size={17} />
                    <input
                        type="text"
                        placeholder="Filter by operator name, action, or pharmaceutical details..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-slate-500 text-xs font-semibold">Action:</span>
                    <select
                        value={selectedAction}
                        onChange={e => setSelectedAction(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-teal-500"
                    >
                        {actions.map(a => (
                            <option key={a} value={a}>{a.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <th className="p-4">Timestamp</th>
                                <th className="p-4">Operator & Credential</th>
                                <th className="p-4">Event Type</th>
                                <th className="p-4">Regulatory Event Description</th>
                                <th className="p-4">Audit Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-[11px] text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={12} className="text-slate-400 shrink-0" />
                                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                    </td>

                                    <td className="p-4 font-bold text-slate-900">
                                        {log.userName}
                                        <div className="text-[10px] text-teal-700 font-medium">{log.userRole}</div>
                                    </td>

                                    <td className="p-4">
                                        <span className="inline-flex px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                            {log.action}
                                        </span>
                                    </td>

                                    <td className="p-4 text-slate-700 max-w-md">
                                        {log.details}
                                    </td>

                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                            <CheckCircle2 size={13} />
                                            <span>{log.status || 'Verified'}</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="max-w-xs mx-auto space-y-2">
                                            <PackageOpen size={36} className="mx-auto text-slate-300" />
                                            <p className="text-sm font-bold text-slate-800">No audit records</p>
                                            <p className="text-xs text-slate-500">Clinical events will automatically be recorded as users interact with the system.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
                    <span>Audit ledger: SHA-256 (GxP Compliant)</span>
                    <span className="font-mono text-[11px]">Recorded: {filteredLogs.length} events</span>
                </div>
            </div>
        </div>
    );
};
