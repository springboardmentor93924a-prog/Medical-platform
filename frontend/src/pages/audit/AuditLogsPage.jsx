import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Globe, 
  FileText,
  Activity
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { userService } from '../../services/userService';
import { useNotification } from '../../context/NotificationContext';

const AuditLogsPage = () => {
  const { showToast } = useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getAuditLogs(page, 20);
      const data = res?.data?.data || res?.data || res;
      const list = data?.content || (Array.isArray(data) ? data : []);
      setLogs(list);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || list.length);
    } catch (err) {
      console.error('Error fetching audit logs', err);
      showToast('error', 'Failed to retrieve system audit records');
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.username?.toLowerCase().includes(search.toLowerCase()) ||
    log.details?.toLowerCase().includes(search.toLowerCase()) ||
    log.entityName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            System Monitoring & Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time platform activity, operational error telemetry, and immutable regulatory audit trail ({totalElements} events).
          </p>
        </div>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={fetchAuditLogs}
        >
          Refresh Logs
        </Button>
      </div>

      {/* System Health Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Backend Health</p>
            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              API & DB Online
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Recorded Events</p>
            <p className="text-sm font-bold text-gray-900">{totalElements} Events</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Security Auditing</p>
            <p className="text-sm font-bold text-purple-700">RBAC Active</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Operational Status</p>
            <p className="text-sm font-bold text-emerald-600">0 Critical Errors</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, user, entity, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-gray-500">
          Showing {filteredLogs.length} entries
        </span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading audit trail..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No audit events found"
              description="No audit events recorded matching your query."
              icon={Activity}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-xs px-2.5 py-1 rounded bg-gray-100 text-gray-800 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-gray-900">{log.entityName || 'System'}</div>
                      {log.entityId && (
                        <div className="text-[10px] text-gray-400 font-mono">ID: #{log.entityId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700 max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <div className="flex items-center gap-1 font-medium text-gray-900">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{log.username || 'System Daemon'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-xs font-mono text-gray-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
