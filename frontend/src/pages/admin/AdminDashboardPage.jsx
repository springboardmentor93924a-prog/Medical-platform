import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  IconDashboard,
  IconPill,
  IconAlertTriangle,
  IconClock,
  IconOrders,
  IconSuppliers,
  IconReports,
  IconPackage,
  IconRefresh,
  IconChevronRight,
  IconUser,
  IconCheckCircle
} from '../../components/icons/Icons';
import { fetchDashboardStats } from '../../services/api';
import { wsService } from '../../services/websocket';
import './AdminDashboardPage.css';

// Inventory Value Trend data points matching reference chart (Mar 25 to Apr 24)
const TREND_DATA_MAP = {
  '7D': [
    { date: 'Apr 18', value: 38200 },
    { date: 'Apr 19', value: 39500 },
    { date: 'Apr 20', value: 41200 },
    { date: 'Apr 21', value: 43000 },
    { date: 'Apr 22', value: 44800 },
    { date: 'Apr 23', value: 46500 },
    { date: 'Apr 24', value: 48732 },
  ],
  '30D': [
    { date: 'Mar 25', value: 16500 },
    { date: 'Mar 28', value: 19200 },
    { date: 'Mar 31', value: 22800 },
    { date: 'Apr 03', value: 26000 },
    { date: 'Apr 06', value: 29500 },
    { date: 'Apr 09', value: 33200 },
    { date: 'Apr 12', value: 35000 },
    { date: 'Apr 15', value: 36800 },
    { date: 'Apr 18', value: 40500 },
    { date: 'Apr 21', value: 44200 },
    { date: 'Apr 24', value: 48732 },
  ],
  '3M': [
    { date: 'Feb 01', value: 12000 },
    { date: 'Feb 15', value: 18500 },
    { date: 'Mar 01', value: 24000 },
    { date: 'Mar 15', value: 31000 },
    { date: 'Apr 01', value: 39000 },
    { date: 'Apr 24', value: 48732 },
  ],
  '6M': [
    { date: 'Nov', value: 9500 },
    { date: 'Dec', value: 14000 },
    { date: 'Jan', value: 21000 },
    { date: 'Feb', value: 28000 },
    { date: 'Mar', value: 37500 },
    { date: 'Apr', value: 48732 },
  ],
  '1Y': [
    { date: 'Q1', value: 8500 },
    { date: 'Q2', value: 17000 },
    { date: 'Q3', value: 32000 },
    { date: 'Q4', value: 48732 },
  ],
};

// Stock Distribution Donut Data
const STOCK_DISTRIBUTION_DATA = [
  { name: 'Tablets', value: 48, color: '#008C8C' },
  { name: 'Capsules', value: 22, color: '#0284C7' },
  { name: 'Syrups', value: 12, color: '#F59E0B' },
  { name: 'Injections', value: 10, color: '#8B5CF6' },
  { name: 'Others', value: 8, color: '#94A3B8' },
];

// Supplier Analytics Donut Data
const SUPPLIER_ANALYTICS_DATA = [
  { name: 'ABC Pharma', value: 25, color: '#008C8C' },
  { name: 'Global MedTech', value: 20, color: '#0284C7' },
  { name: 'HealthCare Ltd', value: 15, color: '#F59E0B' },
  { name: 'MediPlus Pharma', value: 10, color: '#8B5CF6' },
  { name: 'Others', value: 30, color: '#94A3B8' },
];

// Recent Purchase Orders matching screenshot
const RECENT_ORDERS = [
  { id: 'PO-2025-0018', supplier: 'ABC Pharma', date: 'Apr 24, 2025', status: 'Pending', statusClass: 'admin-dash__status--pending' },
  { id: 'PO-2025-0017', supplier: 'Global MedTech', date: 'Apr 22, 2025', status: 'Approved', statusClass: 'admin-dash__status--approved' },
  { id: 'PO-2025-0016', supplier: 'HealthCare Ltd', date: 'Apr 20, 2025', status: 'Ordered', statusClass: 'admin-dash__status--ordered' },
  { id: 'PO-2025-0015', supplier: 'MediPlus Pharma', date: 'Apr 18, 2025', status: 'Received', statusClass: 'admin-dash__status--received' },
  { id: 'PO-2025-0014', supplier: 'ABC Pharma', date: 'Apr 15, 2025', status: 'Partially Received', statusClass: 'admin-dash__status--partial' },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [_loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30D');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardStats();
      if (data) setStats(data);
    } catch (err) {
      console.warn('Dashboard stats using cached / default fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubOrders = wsService.subscribeOrders((evt) => {
      console.log('[AdminDashboard] Live purchase order event:', evt);
      loadData();
    });
    const unsubInv = wsService.subscribeInventory((evt) => {
      console.log('[AdminDashboard] Live inventory event:', evt);
      loadData();
    });
    const unsubDeliveries = wsService.subscribeDeliveries((evt) => {
      console.log('[AdminDashboard] Live delivery event:', evt);
      loadData();
    });
    const unsubReconnect = wsService.onReconnect(() => {
      loadData();
    });
    return () => {
      unsubOrders();
      unsubInv();
      unsubDeliveries();
      unsubReconnect();
    };
  }, [loadData]);

  // Real database numbers with safe fallback
  const totalMedicines = stats?.totalMedicines != null ? stats.totalMedicines.toLocaleString() : '0';
  const lowStockCount = stats?.lowStockCount != null ? stats.lowStockCount : 0;
  const inStockCount = Math.max(0, (stats?.totalMedicines || 0) - (lowStockCount || 0));
  const expiringCount = stats?.expiringSoonCount != null ? stats.expiringSoonCount : 0;
  const purchaseOrdersCount = stats?.pendingPurchaseOrders != null ? stats.pendingPurchaseOrders : 0;
  const totalSuppliers = stats?.totalSuppliers != null ? stats.totalSuppliers : 0;

  const chartTrendData = TREND_DATA_MAP[timeframe] || TREND_DATA_MAP['30D'];

  return (
    <div className="admin-dash-page">
      {/* ── 01 Reference Hero: Clay Welcome Banner ── */}
      <div className="clay-welcome-banner fade-in">
        <div>
          <h1 className="clay-welcome-title">Welcome, Admin!</h1>
          <p className="clay-welcome-subtitle">Pharmacy Inventory Management System</p>
        </div>
        <div className="clay-bottles-graphic" aria-hidden="true">
          <div className="clay-bottle clay-bottle--teal">
            <div className="clay-bottle-cap" />
          </div>
          <div className="clay-bottle clay-bottle--amber">
            <div className="clay-bottle-cap" />
          </div>
          <div className="clay-bottle clay-bottle--lavender">
            <div className="clay-bottle-cap" />
          </div>
        </div>
      </div>

      {/* ── 5 Clay Metric Stat Tiles Matching Reference 01 ── */}
      <div className="admin-dash__clay-stat-row">
        {/* 1. Total Medicines */}
        <div className="clay-stat-tile" onClick={() => navigate('/admin/medicines')}>
          <div>
            <span className="clay-stat-tile__label">Total Medicines:</span>
            <div className="clay-stat-tile__value-row">
              <span className="clay-stat-tile__value">{totalMedicines}</span>
              <span className="clay-stat-tile__badge clay-stat-tile__badge--green">(+2%)</span>
            </div>
          </div>
        </div>

        {/* 2. In Stock */}
        <div className="clay-stat-tile" onClick={() => navigate('/admin/stock')}>
          <div>
            <span className="clay-stat-tile__label">In Stock:</span>
            <div className="clay-stat-tile__value-row">
              <span className="clay-stat-tile__value">{inStockCount}</span>
              <span className="clay-stat-tile__badge clay-stat-tile__badge--green">(+1%)</span>
            </div>
          </div>
        </div>

        {/* 3. Low Stock */}
        <div className="clay-stat-tile" onClick={() => navigate('/admin/stock')}>
          <div>
            <span className="clay-stat-tile__label">Low Stock:</span>
            <div className="clay-stat-tile__value-row">
              <span className="clay-stat-tile__value">{lowStockCount}</span>
              <span className="clay-stat-tile__badge clay-stat-tile__badge--coral">(-1%)</span>
            </div>
          </div>
        </div>

        {/* 4. Expiring Soon */}
        <div className="clay-stat-tile" onClick={() => navigate('/admin/expiry')}>
          <div>
            <span className="clay-stat-tile__label">Expiring Soon:</span>
            <div className="clay-stat-tile__value-row">
              <span className="clay-stat-tile__value">{expiringCount}</span>
              <span className="clay-stat-tile__badge clay-stat-tile__badge--green">(+3%)</span>
            </div>
          </div>
        </div>

        {/* 5. Status: Operational */}
        <div className="clay-stat-tile">
          <div>
            <span className="clay-stat-tile__label">Status:</span>
            <div className="clay-stat-tile__value-row">
              <span className="clay-stat-tile__value" style={{ fontSize: '1.25rem', color: '#094b42' }}>Operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Dashboard Layout (Left: 68%, Right: 32%) ── */}
      <div className="admin-dash__main-layout">
        {/* LEFT COLUMN: Inventory Overview + Quick Actions */}
        <div className="admin-dash__col-left">
          {/* Inventory Overview Card matching 01_admin_dashboard.jpg */}
          <div className="admin-dash__card" style={{ marginBottom: 20 }}>
            <div className="admin-dash__card-header" style={{ padding: '18px 24px' }}>
              <h3 className="admin-dash__card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>Inventory Overview</h3>
              <div className="admin-dash__timeframe-pills">
                {['7 Days', '30 Days', '90 Days'].map((t) => {
                  const key = t.startsWith('7') ? '7D' : t.startsWith('30') ? '30D' : '3M';
                  return (
                    <button
                      key={t}
                      className={`admin-dash__timeframe-btn ${timeframe === key ? 'admin-dash__timeframe-btn--active' : ''}`}
                      onClick={() => setTimeframe(key)}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ width: '100%', height: 240, padding: '0 16px 12px 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartTrendData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  />
                  <Tooltip
                    formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Inventory Value']}
                    contentStyle={{ background: '#0F4A47', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#14B8A6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#invGradient)"
                    dot={{ r: 3, fill: '#0D9488' }}
                    activeDot={{ r: 6, fill: '#0F766E' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions Row matching 01_admin_dashboard.jpg */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#102E59', margin: '0 0 12px 4px' }}>Quick Actions</h4>
            <div className="admin-dash__quick-actions-row">
              <button
                className="clay-btn-pastel clay-btn-pastel--mint"
                onClick={() => navigate('/admin/medicines')}
              >
                + Add Medicine
              </button>
              <button
                className="clay-btn-pastel clay-btn-pastel--blue"
                onClick={() => navigate('/admin/purchases')}
              >
                New Purchase Order
              </button>
              <button
                className="clay-btn-pastel clay-btn-pastel--coral"
                onClick={() => navigate('/admin/stock')}
              >
                Check Stock
              </button>
              <button
                className="clay-btn-pastel clay-btn-pastel--lavender"
                onClick={() => navigate('/admin/reports')}
              >
                Generate Report
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════
              8-CORE OPERATIONAL INTELLIGENCE HUB (All 8 Features Integrated)
             ══════════════════════════════════════════════════════════ */}
          <div className="admin-dash__card" style={{ marginBottom: 24 }}>
            <div className="admin-dash__card-header" style={{ padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
              <div className="admin-dash__card-title-group">
                <span className="admin-dash__card-header-icon" style={{ background: '#e6fffa', color: '#008C8C' }}>
                  ⚡
                </span>
                <div>
                  <h3 className="admin-dash__card-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                    8-Core Operations Intelligence Hub
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Real-time monitoring across all 8 centralized enterprise modules
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: 12 }}>
                  ● All Systems Live
                </span>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
              padding: '16px 20px'
            }}>
              {/* Feature 1: FEFO Inventory */}
              <div
                onClick={() => navigate('/admin/medicines?tab=fefo-inventory')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>1. FEFO Inventory</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 8 }}>98.4% Compliant</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Earliest expiry prioritized dispensing. Automated batch sorting active.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Open FEFO Console →</div>
              </div>

              {/* Feature 2: AI Inventory Recommendations */}
              <div
                onClick={() => navigate('/admin/ai-forecast')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>2. AI Inventory Engine</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: 8 }}>3 Risk Alerts</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Predictive stock-out modeling & dynamic reorder recommendations.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Open AI Forecast →</div>
              </div>

              {/* Feature 3: Medicine Returns & Quarantine */}
              <div
                onClick={() => navigate('/admin/stock?tab=returns')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>3. Returns & Quarantine</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '2px 8px', borderRadius: 8 }}>Inspection Gate</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Zero-leakage quarantine isolation. Physical QA before restock.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Quarantine Console →</div>
              </div>

              {/* Feature 4: Database Backup & Restore */}
              <div
                onClick={() => navigate('/admin/backup-restore')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>4. Automated Backup</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 8 }}>SHA-256 Validated</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Nightly disaster recovery snaps with preview verification.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Backup & Recovery →</div>
              </div>

              {/* Feature 5: Feedback & Issue Management */}
              <div
                onClick={() => navigate('/admin/feedback')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>5. Feedback Management</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366f1', background: '#e0e7ff', padding: '2px 8px', borderRadius: 8 }}>SLA 2.4h</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>4-role ticket communication, priority triage & issue resolution.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Feedback Hub →</div>
              </div>

              {/* Feature 6: SMTP Email Notification System */}
              <div
                onClick={() => navigate('/admin/email-monitoring')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>6. SMTP Email Outbox</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 8 }}>Active Outbox</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Multi-role HTML triggers, retry queue & user notification preferences.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Email Monitoring →</div>
              </div>

              {/* Feature 7: Wastage & Loss Prevention */}
              <div
                onClick={() => navigate('/admin/wastage')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>7. Wastage & Loss Control</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', background: '#fee2e2', padding: '2px 8px', borderRadius: 8 }}>Strict Control</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Disposal sign-off, financial impact analytics & compliance audit.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Wastage Module →</div>
              </div>

              {/* Feature 8: Role-Based Activity & Audit Logs */}
              <div
                onClick={() => navigate('/admin/audit-logs')}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                className="clay-card-hover"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#102e59' }}>8. Activity & Audit Logs</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 8 }}>Immutable Ledger</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Comprehensive 4-role action trail, IP logging & before/after diffs.</div>
                <div style={{ fontSize: '0.75rem', color: '#008C8C', fontWeight: 700, marginTop: 'auto' }}>Audit Logs →</div>
              </div>
            </div>
          </div>

          {/* Card: Stock Value & Analytics */}
          <div className="admin-dash__card">
            <div className="admin-dash__card-header">
              <div className="admin-dash__card-title-group">
                <span className="admin-dash__card-header-icon">
                  <IconReports size={18} />
                </span>
                <h3 className="admin-dash__card-title">Stock Value & Analytics</h3>
              </div>
              <div className="admin-dash__timeframe-pills">
                {['7D', '30D', '3M', '6M', '1Y'].map((t) => (
                  <button
                    key={t}
                    className={`admin-dash__timeframe-btn ${timeframe === t ? 'admin-dash__timeframe-btn--active' : ''}`}
                    onClick={() => setTimeframe(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-dash__analytics-split">
              {/* Left Sub-chart: Inventory Value Trend */}
              <div>
                <h4 className="admin-dash__chart-section-title">Inventory Value Trend</h4>
                <div style={{ width: '100%', height: 210 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#008C8C" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#008C8C" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                      <YAxis
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        domain={[0, 60000]}
                      />
                      <Tooltip
                        formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Inventory Value']}
                        contentStyle={{ background: '#004D57', borderRadius: '8px', color: '#fff', border: 'none', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#008C8C"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#invGradient)"
                        dot={{ r: 3, fill: '#008C8C' }}
                        activeDot={{ r: 5, fill: '#004D57' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Sub-chart: Stock Distribution */}
              <div>
                <h4 className="admin-dash__chart-section-title">Stock Distribution</h4>
                <div className="admin-dash__donut-wrapper">
                  <div className="admin-dash__donut-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={STOCK_DISTRIBUTION_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={78}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {STOCK_DISTRIBUTION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="admin-dash__donut-center-label">
                      <span className="admin-dash__donut-center-num">{stats?.totalStockItems != null ? stats.totalStockItems.toLocaleString() : totalMedicines}</span>
                      <span className="admin-dash__donut-center-text">Total Medicines</span>
                    </div>
                  </div>

                  <div className="admin-dash__legend-list">
                    {STOCK_DISTRIBUTION_DATA.map((item) => (
                      <div key={item.name} className="admin-dash__legend-item">
                        <div className="admin-dash__legend-left">
                          <span className="admin-dash__legend-dot" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <span className="admin-dash__legend-pct">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row: Supplier Analytics + Recent Purchase Orders */}
          <div className="admin-dash__sub-grid-2">
            {/* Supplier Analytics */}
            <div className="admin-dash__card">
              <div className="admin-dash__card-header">
                <div className="admin-dash__card-title-group">
                  <span className="admin-dash__card-header-icon">
                    <IconSuppliers size={18} />
                  </span>
                  <h3 className="admin-dash__card-title">Supplier Analytics</h3>
                </div>
                <button className="admin-dash__card-link" onClick={() => navigate('/admin/suppliers')}>
                  View All
                </button>
              </div>

              <div className="admin-dash__donut-wrapper">
                <div className="admin-dash__donut-chart-container" style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SUPPLIER_ANALYTICS_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={46}
                        outerRadius={66}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {SUPPLIER_ANALYTICS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="admin-dash__donut-center-label">
                    <span className="admin-dash__donut-center-num">{totalSuppliers}</span>
                    <span className="admin-dash__donut-center-text">Total Suppliers</span>
                  </div>
                </div>

                <div className="admin-dash__legend-list">
                  {SUPPLIER_ANALYTICS_DATA.map((item) => (
                    <div key={item.name} className="admin-dash__legend-item">
                      <div className="admin-dash__legend-left">
                        <span className="admin-dash__legend-dot" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="admin-dash__legend-pct">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Purchase Orders */}
            <div className="admin-dash__card">
              <div className="admin-dash__card-header">
                <div className="admin-dash__card-title-group">
                  <span className="admin-dash__card-header-icon">
                    <IconOrders size={18} />
                  </span>
                  <h3 className="admin-dash__card-title">Recent Purchase Orders</h3>
                </div>
                <button className="admin-dash__card-link" onClick={() => navigate('/admin/purchases')}>
                  View All
                </button>
              </div>

              <div className="admin-dash__table-wrapper">
                <table className="admin-dash__table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                      stats.recentOrders.map((o) => {
                        const poNum = o.orderNumber || `PO-2025-${String(o.purchaseOrderId || o.orderId || o.id).padStart(4, '0')}`;
                        const supName = o.supplier?.supplierName || o.supplierName || 'Apex Medical';
                        const dt = o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent';
                        const st = (o.status || 'PENDING_APPROVAL').replace(/_/g, ' ');
                        let cls = 'admin-dash__status--pending';
                        if (st.includes('PENDING')) cls = 'admin-dash__status--pending';
                        else if (st.includes('APPROV')) cls = 'admin-dash__status--approved';
                        else if (st.includes('ORDER') || st.includes('TRANSIT')) cls = 'admin-dash__status--ordered';
                        else if (st.includes('RECEIV') || st.includes('DELIVER')) cls = 'admin-dash__status--received';
                        else if (st.includes('PARTIAL')) cls = 'admin-dash__status--partial';
                        else if (st.includes('REJECT')) cls = 'admin-dash__status--rejected';

                        return (
                          <tr key={poNum}>
                            <td className="admin-dash__po-code">{poNum}</td>
                            <td>{supName}</td>
                            <td>{dt}</td>
                            <td>
                              <span className={`admin-dash__status-pill ${cls}`}>
                                {st}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px 16px', color: '#94a3b8' }}>
                          No recent purchase orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row: Stock Movement Summary */}
          <div className="admin-dash__card">
            <div className="admin-dash__card-header">
              <div className="admin-dash__card-title-group">
                <span className="admin-dash__card-header-icon">
                  <IconReports size={18} />
                </span>
                <h3 className="admin-dash__card-title">Stock Movement Summary</h3>
              </div>
              <button className="admin-dash__card-link" onClick={() => navigate('/admin/stock')}>
                View Details
              </button>
            </div>

            <div className="admin-dash__movement-grid">
              {/* Total Inward */}
              <div className="admin-dash__movement-box">
                <div className="admin-dash__movement-icon admin-dash__movement-icon--inward">
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>↑</span>
                </div>
                <div className="admin-dash__movement-info">
                  <span className="admin-dash__movement-label">Total Inward</span>
                  <span className="admin-dash__movement-val">{stats?.totalInward ?? 0}</span>
                  <span className="admin-dash__movement-trend admin-dash__trend--up">
                    Verified <span className="admin-dash__trend-caption">received</span>
                  </span>
                </div>
              </div>

              {/* Total Outward */}
              <div className="admin-dash__movement-box">
                <div className="admin-dash__movement-icon admin-dash__movement-icon--outward">
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>↓</span>
                </div>
                <div className="admin-dash__movement-info">
                  <span className="admin-dash__movement-label">Total Outward</span>
                  <span className="admin-dash__movement-val">{stats?.totalOutward ?? 0}</span>
                  <span className="admin-dash__movement-trend admin-dash__trend--alert">
                    Dispatched <span className="admin-dash__trend-caption">dispensed</span>
                  </span>
                </div>
              </div>

              {/* Adjustment */}
              <div className="admin-dash__movement-box">
                <div className="admin-dash__movement-icon admin-dash__movement-icon--adjustment">
                  <IconRefresh size={18} />
                </div>
                <div className="admin-dash__movement-info">
                  <span className="admin-dash__movement-label">Adjustment</span>
                  <span className="admin-dash__movement-val">{stats?.totalAdjustments ?? 0}</span>
                  <span className="admin-dash__movement-trend admin-dash__trend--up">
                    Audited <span className="admin-dash__trend-caption">adjustments</span>
                  </span>
                </div>
              </div>

              {/* Current Stock Value */}
              <div className="admin-dash__movement-box">
                <div className="admin-dash__movement-icon admin-dash__movement-icon--value">
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>$</span>
                </div>
                <div className="admin-dash__movement-info">
                  <span className="admin-dash__movement-label">Current Stock Value</span>
                  <span className="admin-dash__movement-val">
                    {stats?.inventoryValue ? '$ ' + Number(stats.inventoryValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$ 0.00'}
                  </span>
                  <span className="admin-dash__movement-trend admin-dash__trend--up">
                    Estimated <span className="admin-dash__trend-caption">valuation</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recent Activities Timeline + Important Alerts */}
        <div className="admin-dash__col-right">
          {/* Recent Activities Timeline matching 01_admin_dashboard.jpg */}
          <div className="admin-dash__card" style={{ marginBottom: 20 }}>
            <div className="admin-dash__card-header" style={{ padding: '18px 24px' }}>
              <div className="admin-dash__card-title-group">
                <span className="admin-dash__card-header-icon">
                  <IconClock size={18} />
                </span>
                <h3 className="admin-dash__card-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>Recent Activities</h3>
              </div>
              <button className="admin-dash__card-link" onClick={() => navigate('/admin/reports')}>
                View All
              </button>
            </div>

            <div style={{ padding: '8px 20px 24px 24px' }}>
              <div className="clay-timeline">
                <div className="clay-timeline-node">
                  <span className="clay-timeline-dot clay-timeline-dot--teal" />
                  <div className="clay-timeline-chip" onClick={() => navigate('/admin/stock')}>
                    <span>Stock received & batch verified</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>3 hrs ago</span>
                  </div>
                </div>

                <div className="clay-timeline-node">
                  <span className="clay-timeline-dot clay-timeline-dot--teal" />
                  <div className="clay-timeline-chip" onClick={() => navigate('/admin/medicines')}>
                    <span>Medicine catalog updated (Amoxicillin)</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>5 hrs ago</span>
                  </div>
                </div>

                <div className="clay-timeline-node">
                  <span className="clay-timeline-dot clay-timeline-dot--blue" />
                  <div className="clay-timeline-chip" onClick={() => navigate('/admin/expiry')}>
                    <span>Expiry check completed for Ward 3</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Today</span>
                  </div>
                </div>

                <div className="clay-timeline-node">
                  <span className="clay-timeline-dot clay-timeline-dot--purple" />
                  <div className="clay-timeline-chip" onClick={() => navigate('/admin/purchases')}>
                    <span>Purchase order PO-2025-0018 approved</span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>Yesterday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Alerts */}
          <div className="admin-dash__card">
            <div className="admin-dash__card-header">
              <div className="admin-dash__card-title-group">
                <span className="admin-dash__card-header-icon admin-dash__card-header-icon--red">
                  <IconAlertTriangle size={18} />
                </span>
                <h3 className="admin-dash__card-title">Important Alerts</h3>
              </div>
              <button className="admin-dash__card-link" onClick={() => navigate('/admin/notifications')}>
                View All
              </button>
            </div>

            <div className="admin-dash__feed-list">
              {/* Alert 1 */}
              <div className="admin-dash__feed-item" onClick={() => navigate('/admin/stock')}>
                <div className="admin-dash__feed-left">
                  <div className="admin-dash__feed-icon-circle admin-dash__feed-icon--red">
                    <IconAlertTriangle size={17} />
                  </div>
                  <div className="admin-dash__feed-text">
                    <span className="admin-dash__feed-title">Low stock alert</span>
                    <span className="admin-dash__feed-desc">Paracetamol 500mg (3 units left)</span>
                    <span className="admin-dash__feed-time">Apr 24, 2025 • 09:12 AM</span>
                  </div>
                </div>
                <IconChevronRight size={16} className="admin-dash__feed-chevron" />
              </div>

              {/* Alert 2 */}
              <div className="admin-dash__feed-item" onClick={() => navigate('/admin/expiry')}>
                <div className="admin-dash__feed-left">
                  <div className="admin-dash__feed-icon-circle admin-dash__feed-icon--amber">
                    <IconClock size={17} />
                  </div>
                  <div className="admin-dash__feed-text">
                    <span className="admin-dash__feed-title">Medicine expiring soon</span>
                    <span className="admin-dash__feed-desc">Amoxicillin 500mg (3 days left)</span>
                    <span className="admin-dash__feed-time">Apr 24, 2025 • 08:45 AM</span>
                  </div>
                </div>
                <IconChevronRight size={16} className="admin-dash__feed-chevron" />
              </div>

              {/* Alert 3 */}
              <div className="admin-dash__feed-item" onClick={() => navigate('/admin/purchases')}>
                <div className="admin-dash__feed-left">
                  <div className="admin-dash__feed-icon-circle admin-dash__feed-icon--green">
                    <IconOrders size={17} />
                  </div>
                  <div className="admin-dash__feed-text">
                    <span className="admin-dash__feed-title">Purchase order pending</span>
                    <span className="admin-dash__feed-desc">PO-2025-0018 waiting for approval</span>
                    <span className="admin-dash__feed-time">Apr 24, 2025 • 08:20 AM</span>
                  </div>
                </div>
                <IconChevronRight size={16} className="admin-dash__feed-chevron" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
