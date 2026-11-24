import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import {
  IconPill, IconPackage, IconAlertTriangle, IconClock,
  IconOrders, IconTrendUp,
} from '../../components/icons/Icons';
import { fetchDashboardStats, fetchMedicines } from '../../services/api';
import './DashboardPage.css';

/*
 * ─── UI SAMPLE DATA ─────────────────────────────────────────────────
 * This data is clearly marked as SAMPLE / DEMO data for the UI.
 * It is NOT fetched from the database. It exists solely so the
 * dashboard charts and cards have something to render before the
 * backend endpoints are built.
 *
 * Once backend endpoints like GET /api/dashboard/stats are ready,
 * replace these with real API responses.
 * ──────────────────────────────────────────────────────────────────────
 */
const SAMPLE_STATS = [
  {
    title: 'Total Medicines',
    value: '—',           // will be replaced by live count
    subtitle: 'Fetched from database',
    trend: null,
    icon: <IconPill size={24} />,
    accentColor: 'var(--color-primary-50)',
    iconColor: 'var(--color-primary-600)',
    liveKey: 'totalMedicines',
  },
  {
    title: 'In Stock',
    value: '1,024',
    subtitle: 'Sample data — backend not connected',
    trend: 'up',
    icon: <IconPackage size={24} />,
    accentColor: 'var(--color-success-50)',
    iconColor: 'var(--color-success-700)',
  },
  {
    title: 'Low Stock Alerts',
    value: '23',
    subtitle: 'Sample data — backend not connected',
    trend: 'down',
    icon: <IconAlertTriangle size={24} />,
    accentColor: 'var(--color-warning-50)',
    iconColor: 'var(--color-warning-700)',
  },
  {
    title: 'Expiring Soon',
    value: '8',
    subtitle: 'Sample data — backend not connected',
    trend: null,
    icon: <IconClock size={24} />,
    accentColor: 'var(--color-danger-50)',
    iconColor: 'var(--color-danger-700)',
  },
];

/* Sample chart data (UI demo only — not from the database) */
const SAMPLE_MONTHLY_USAGE = [
  { month: 'Jan', usage: 420, received: 380 },
  { month: 'Feb', usage: 380, received: 410 },
  { month: 'Mar', usage: 510, received: 450 },
  { month: 'Apr', usage: 470, received: 490 },
  { month: 'May', usage: 530, received: 500 },
  { month: 'Jun', usage: 490, received: 540 },
  { month: 'Jul', usage: 610, received: 580 },
  { month: 'Aug', usage: 560, received: 550 },
  { month: 'Sep', usage: 480, received: 520 },
  { month: 'Oct', usage: 540, received: 510 },
  { month: 'Nov', usage: 590, received: 560 },
  { month: 'Dec', usage: 620, received: 600 },
];

const SAMPLE_CATEGORY_DATA = [
  { name: 'Antibiotics', value: 320 },
  { name: 'Analgesics', value: 240 },
  { name: 'Vitamins', value: 180 },
  { name: 'Cardiovascular', value: 150 },
  { name: 'Respiratory', value: 110 },
];

const SAMPLE_TOP_MEDICINES = [
  { name: 'Paracetamol 500mg', dispensed: 284 },
  { name: 'Amoxicillin 250mg', dispensed: 213 },
  { name: 'Ibuprofen 400mg', dispensed: 198 },
  { name: 'Omeprazole 20mg', dispensed: 176 },
  { name: 'Metformin 500mg', dispensed: 145 },
];

const SAMPLE_RECENT_ACTIVITY = [
  { id: 1, action: 'Stock received', item: 'Paracetamol 500mg', qty: '+500 units', time: '2 hours ago', status: 'success' },
  { id: 2, action: 'Low stock alert', item: 'Amoxicillin 250mg', qty: '12 units left', time: '4 hours ago', status: 'warning' },
  { id: 3, action: 'Order placed', item: 'Ibuprofen 400mg', qty: '200 units', time: '6 hours ago', status: 'info' },
  { id: 4, action: 'Expired batch', item: 'Vitamin C 1000mg', qty: 'Batch #VC-2024', time: '1 day ago', status: 'danger' },
  { id: 5, action: 'Stock received', item: 'Metformin 500mg', qty: '+300 units', time: '1 day ago', status: 'success' },
];

const PIE_COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

/* ─── Custom Chart Tooltip ─── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="chart-tooltip__value" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Dashboard Page Component                                          */
/* ═══════════════════════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveStats, setLiveStats] = useState(null);      // from backend
  const [medicineCount, setMedicineCount] = useState(null); // from GET /api/medicines

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      // Try to fetch real data from the backend
      const [dashStats, medicines] = await Promise.all([
        fetchDashboardStats(),
        fetchMedicines(),
      ]);

      if (dashStats) setLiveStats(dashStats);
      if (medicines) setMedicineCount(medicines.length);
    } catch (err) {
      console.error('Dashboard data error:', err);
      // Don't set error for network failures — just show sample data
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (error) {
    return <ErrorState title="Dashboard Error" message={error} onRetry={loadData} />;
  }

  /* Build stat cards — merge live data into sample cards */
  const statCards = SAMPLE_STATS.map((card) => {
    if (card.liveKey === 'totalMedicines' && medicineCount !== null) {
      return {
        ...card,
        value: medicineCount.toLocaleString(),
        subtitle: 'From database',
        trend: 'up',
      };
    }
    return card;
  });

  return (
    <div className="dashboard-page">
      {/* ── Stat cards ── */}
      <section className="dashboard-page__stats" id="dashboard-stats">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </section>

      {/* ── Charts row ── */}
      <section className="dashboard-page__charts">
        {/* Area chart — Monthly usage vs received */}
        <div className="dashboard-card dashboard-card--wide fade-in" id="chart-usage">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">Inventory Movement</h2>
              <p className="dashboard-card__subtitle">Monthly usage vs stock received (sample data)</p>
            </div>
          </div>
          <div className="dashboard-card__body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={SAMPLE_MONTHLY_USAGE} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ef" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#718096' }} />
                <YAxis tick={{ fontSize: 12, fill: '#718096' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="usage" name="Dispensed" stroke="#0d9488" fill="url(#gradUsage)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="received" name="Received" stroke="#3b82f6" fill="url(#gradReceived)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart — Category distribution */}
        <div className="dashboard-card fade-in" id="chart-categories">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">By Category</h2>
              <p className="dashboard-card__subtitle">Stock distribution (sample data)</p>
            </div>
          </div>
          <div className="dashboard-card__body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={SAMPLE_CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {SAMPLE_CATEGORY_DATA.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── Bottom row ── */}
      <section className="dashboard-page__bottom">
        {/* Top dispensed medicines */}
        <div className="dashboard-card fade-in" id="top-medicines">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">Top Dispensed</h2>
              <p className="dashboard-card__subtitle">Most dispensed this month (sample data)</p>
            </div>
          </div>
          <div className="dashboard-card__body">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={SAMPLE_TOP_MEDICINES} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8ef" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#718096' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} width={110} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="dispensed" name="Units" fill="#0d9488" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent activity */}
        <div className="dashboard-card fade-in" id="recent-activity">
          <div className="dashboard-card__header">
            <div>
              <h2 className="dashboard-card__title">Recent Activity</h2>
              <p className="dashboard-card__subtitle">Latest inventory changes (sample data)</p>
            </div>
          </div>
          <div className="dashboard-card__body dashboard-card__body--flush">
            <ul className="activity-list">
              {SAMPLE_RECENT_ACTIVITY.map((item) => (
                <li key={item.id} className="activity-list__item">
                  <div className="activity-list__content">
                    <span className="activity-list__action">{item.action}</span>
                    <span className="activity-list__item-name">{item.item}</span>
                    <span className="activity-list__meta">
                      <StatusBadge variant={item.status} label={item.qty} />
                      <span className="activity-list__time">{item.time}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Data source note */}
      <p className="dashboard-page__note">
        ℹ️ Charts and statistics marked "sample data" are UI demonstrations. Connect backend endpoints to display real data.
      </p>
    </div>
  );
}
