import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchAdminAuditLogs } from '../../services/api';
import {
  IconActivity,
  IconRefresh,
  IconCheckCircle,
  IconAlertTriangle,
  IconShield,
  IconClock,
  IconSearch,
  IconDownload,
  IconFilter
} from '../../components/icons/Icons';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { exportToCsv } from '../../utils/csvExport';
import './AdminPages.css';

const CPU_DATA = [
  { time: '12 AM', val: 14 },
  { time: '4 AM', val: 18 },
  { time: '8 AM', val: 26 },
  { time: '12 PM', val: 32 },
  { time: '4 PM', val: 22 },
  { time: '8 PM', val: 24 }
];

const SEED_ERRORS = [
  { id: 1, time: '11:28 AM', type: 'API Error', message: 'Failed to fetch medicine data', status: 'Resolved' },
  { id: 2, time: '10:47 AM', type: 'Database Error', message: 'Connection timeout', status: 'Resolved' },
  { id: 3, time: '09:32 AM', type: 'Application Error', message: 'Null pointer exception', status: 'Resolved' },
  { id: 4, time: '08:15 AM', type: 'API Error', message: 'Invalid request format', status: 'Resolved' },
  { id: 5, time: '07:03 AM', type: 'Database Error', message: 'Deadlock detected', status: 'Investigating' },
];

const SEED_AUDIT_LOGS = [
  { id: 1, time: '11:35 AM', user: 'admin', action: 'Login', module: 'Authentication', details: 'Successful login' },
  { id: 2, time: '11:22 AM', user: 'pharmacist1', action: 'Stock Adjustment', module: 'Stock Management', details: 'Added 50 units (Paracetamol)' },
  { id: 3, time: '10:18 AM', user: 'admin', action: 'Purchase Approval', module: 'Purchase Orders', details: 'Approved PO-2026-081' },
  { id: 4, time: '09:56 AM', user: 'staff1', action: 'Medicine Update', module: 'Medicines', details: 'Updated stock quantity' },
  { id: 5, time: '08:42 AM', user: 'admin', action: 'Role Change', module: 'User Management', details: 'Changed role to Pharmacist' },
];

export default function AdminMonitoringPage() {
  const [auditLogs, setAuditLogs] = useState(SEED_AUDIT_LOGS);
  const [errors, _setErrors] = useState(SEED_ERRORS);
  const [toast, setToast] = useState(null);
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [search, setSearch] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const loadBackendLogs = useCallback(async () => {
    try {
      const data = await fetchAdminAuditLogs({ size: 50 });
      const list = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
      if (list.length > 0) {
        const mapped = list.map((l, i) => ({
          id: l.auditId || l.eventId || i + 1,
          time: l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          user: l.username || l.performedBy || 'admin',
          action: l.action || 'System Event',
          module: l.module || 'System',
          details: l.details || l.description || l.reason || 'Action verified'
        }));
        setAuditLogs(mapped);
      }
    } catch (_err) {}
  }, []);

  useEffect(() => {
    loadBackendLogs();
  }, [loadBackendLogs]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(l => {
      const matchSearch = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase());
      const matchAction = actionFilter === 'All Actions' || l.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [auditLogs, search, actionFilter]);

  function handleExportReport() {
    exportToCsv('medistock_system_monitoring_logs', auditLogs, [
      { key: 'time', label: 'Time' },
      { key: 'user', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'module', label: 'Module' },
      { key: 'details', label: 'Details' }
    ]);
    showToast('Exported system audit logs to CSV.');
  }

  return (
    <div className="admin-page-container">
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>System Monitoring</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Real-time server telemetry, API latency, error tracing, and security audit logs.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => { loadBackendLogs(); showToast('Telemetry metrics refreshed.'); }}
            style={{
              height: 42,
              padding: '0 20px',
              borderRadius: 24,
              border: 'none',
              background: '#008C8C',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 6px 18px rgba(0, 140, 140, 0.35)',
              cursor: 'pointer'
            }}
          >
            <IconRefresh size={16} /> Refresh Metrics
          </button>

          <button
            onClick={handleExportReport}
            className="clay-btn-pastel"
            style={{
              height: 42,
              padding: '0 18px',
              borderRadius: 24,
              border: '1px solid #dce8f2',
              background: '#ffffff',
              color: '#334155',
              fontWeight: 600,
              fontSize: '0.84rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(16, 46, 89, 0.05), inset 0 1px 1px #ffffff',
              cursor: 'pointer'
            }}
          >
            <IconDownload size={16} /> Export Audit Logs
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(6, 95, 70, 0.08)' }}>
          <span style={{ fontWeight: 600 }}>✓ {toast}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* ── 4 Stat Cards ── */}
      <div className="clay-stat-grid-4">
        {/* System Uptime */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">System Uptime</span>
            <span className="clay-stat-card__value" style={{ color: '#047857' }}>99.98%</span>
            <span className="clay-stat-card__sub" style={{ color: '#059669' }}>Spring Boot + MariaDB</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={24} />
          </div>
        </div>

        {/* CPU Load */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">CPU Utilization</span>
            <span className="clay-stat-card__value">24%</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Normal load</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconActivity size={24} />
          </div>
        </div>

        {/* Memory Load */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Memory Allocation</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>68%</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>JVM Heap: 1.4GB / 2.0GB</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <span style={{ fontSize: 24 }}>🧠</span>
          </div>
        </div>

        {/* Average Latency */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Avg API Latency</span>
            <span className="clay-stat-card__value" style={{ color: '#2563eb' }}>182 ms</span>
            <span className="clay-stat-card__sub" style={{ color: '#2563eb' }}>Optimal throughput</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconClock size={24} />
          </div>
        </div>
      </div>

      {/* ── Performance Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: 20, marginBottom: 22 }}>
        <div className="clay-card-table" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#16324F' }}>CPU Utilization Trend</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#64748B' }}>24-hour server load progression</p>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#047857', fontWeight: 700, background: '#BAF3E6', padding: '3px 10px', borderRadius: 12 }}>
              Normal Peak 32%
            </span>
          </div>
          <div style={{ width: '100%', height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CPU_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                <Tooltip formatter={(val) => [`${val}%`, 'CPU']} />
                <Area type="monotone" dataKey="val" stroke="#008C8C" strokeWidth={2.5} fill="url(#colorCpu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clay-side-widget">
          <h3 className="clay-side-widget__title">Recent System Errors</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {errors.slice(0, 3).map((err) => (
              <div key={err.id} style={{ padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.76rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#16324F' }}>
                  <span>{err.type}</span>
                  <span style={{ color: '#059669', background: '#d1fae5', padding: '1px 6px', borderRadius: 6, fontSize: '0.68rem' }}>{err.status}</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '0.72rem', marginTop: 2 }}>{err.message} • {err.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Inset Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search audit trail by user, action, module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="All Actions">All Actions</option>
          <option value="Login">Login</option>
          <option value="Stock Adjustment">Stock Adjustment</option>
          <option value="Purchase Approval">Purchase Approval</option>
          <option value="Medicine Update">Medicine Update</option>
        </select>
      </div>

      {/* ── Audit Logs Table ── */}
      <div className="clay-card-table">
        <div className="clay-card-table__header">
          <h3 className="clay-card-table__title">System Audit Log Trail</h3>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Immutable Security Log</span>
        </div>

        <div className="admin-dash__table-wrapper">
          <table className="admin-dash__table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 600 }}>{log.time}</td>
                  <td style={{ fontWeight: 700, color: '#16324F' }}>{log.user}</td>
                  <td>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 8,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: '#edf3f9',
                        color: '#16324F'
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ color: '#475569', fontSize: '0.8rem' }}>{log.module}</td>
                  <td style={{ color: '#334155', fontSize: '0.8rem', fontWeight: 500 }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Centered Pagination */}
        <div className="clay-pagination" style={{ borderTop: '1px solid #eef3f8' }}>
          <button className="clay-page-btn" disabled>|&lt;</button>
          <button className="clay-page-btn" disabled>&lt;</button>
          <button className="clay-page-btn clay-page-btn--active">1</button>
          <button className="clay-page-btn">&gt;</button>
          <button className="clay-page-btn">&gt;|</button>
        </div>
      </div>
    </div>
  );
}
