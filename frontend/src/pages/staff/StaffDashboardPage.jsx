import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconDashboard,
  IconPill,
  IconClipboard,
  IconCheckCircle,
  IconClock,
  IconAlertTriangle,
  IconTruck,
  IconSearch,
  IconPackage,
  IconInfo,
  IconFolder,
  IconCalendar,
  IconActivity,
  IconUser,
  IconArrowRight,
  IconSparkles
} from '../../components/icons/Icons';
import {
  fetchMedicines,
  fetchBatches,
  fetchTasks,
  fetchNotifications,
  fetchOrders,
  fetchCategories,
  fetchSuppliers
} from '../../services/api';
import { wsService } from '../../services/websocket';
import './StaffCommon.css';
import './StaffDashboardPage.css';
import '../admin/AdminPages.css';

export default function StaffDashboardPage() {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live formatted date & time
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      setDateTime(now.toLocaleDateString('en-US', options));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [medsData, batchesData, tasksData, notifsData, ordersData, catsData, supsData] = await Promise.all([
        fetchMedicines().catch(() => []),
        fetchBatches().catch(() => []),
        fetchTasks().catch(() => []),
        fetchNotifications().catch(() => []),
        fetchOrders().catch(() => []),
        fetchCategories().catch(() => []),
        fetchSuppliers().catch(() => [])
      ]);
      setMedicines(Array.isArray(medsData) ? medsData : []);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
      setSuppliers(Array.isArray(supsData) ? supsData : []);
    } catch (err) {
      console.warn('Using fallback data for staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubDeliveries = wsService.subscribeDeliveries((evt) => {
      console.log('[StaffDashboard] Live delivery update:', evt);
      loadData();
    });
    const unsubOrders = wsService.subscribeOrders((evt) => {
      console.log('[StaffDashboard] Live order update:', evt);
      loadData();
    });
    const unsubInv = wsService.subscribeInventory((evt) => {
      console.log('[StaffDashboard] Live inventory update:', evt);
      loadData();
    });
    const unsubReconnect = wsService.onReconnect(() => {
      loadData();
    });
    return () => {
      unsubDeliveries();
      unsubOrders();
      unsubInv();
      unsubReconnect();
    };
  }, [loadData]);

  // Live real-time statistics strictly from active database state
  const totalStockCount = batches.reduce((acc, b) => acc + (b.quantityAvailable || 0), 0);

  const lowStockCount = batches.filter(b => (b.quantityAvailable || 0) > 0 && (b.quantityAvailable || 0) <= 20).length;
  const outOfStockCount = medicines.filter(m => {
    const mBatches = batches.filter(b => b.medicineId === m.medicineId);
    const sum = mBatches.reduce((a, b) => a + (b.quantityAvailable || 0), 0);
    return sum === 0;
  }).length;

  const nearExpiryCount = batches.filter(b => {
    if (!b.expiryDate) return false;
    const diff = (new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  }).length;

  const pendingDeliveriesCount = orders.filter(o => ['APPROVED', 'ORDERED', 'SHIPPED', 'IN_TRANSIT', 'PARTIALLY_RECEIVED'].includes((o.status || '').toUpperCase())).length;

  // Inventory Alerts list derived dynamically from real inventory
  const alertList = useMemo(() => {
    return batches
      .filter(b => (b.quantityAvailable || 0) <= 20)
      .slice(0, 5)
      .map(b => ({
        name: b.medicine?.medicineName || `Medicine #${b.medicineId}`,
        batch: b.batchNumber || 'N/A',
        qty: b.quantityAvailable || 0,
        status: (b.quantityAvailable || 0) === 0 ? 'Out of Stock' : 'Low Stock',
        expiry: b.expiryDate || 'N/A'
      }));
  }, [batches]);

  // Recent Medicines list derived dynamically from real inventory
  const recentMeds = useMemo(() => {
    return medicines.slice(0, 5).map(m => {
      const mBatches = batches.filter(b => b.medicineId === m.medicineId);
      const qty = mBatches.reduce((a, b) => a + (b.quantityAvailable || 0), 0);
      return {
        name: m.medicineName,
        category: m.category?.categoryName || m.categoryName || 'General',
        qty,
        expiry: mBatches[0]?.expiryDate || 'N/A',
        status: qty > 20 ? 'Active' : qty > 0 ? 'Low Stock' : 'Out of Stock'
      };
    });
  }, [medicines, batches]);

  return (
    <div className="admin-page-container fade-in">
      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Staff Dashboard
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Operational floor tasks, inventory alerts, physical receiving and stock verification.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 600, background: '#ffffff', padding: '8px 16px', borderRadius: 20, border: '1px solid #dce8f2', boxShadow: '0 2px 6px rgba(16,46,89,0.04)' }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'} • <span style={{ color: '#10b981' }}>● Online</span>
          </span>
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 20px' }}
            onClick={() => navigate('/staff/receive')}
          >
            <IconTruck size={16} /> Receive Goods
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={() => navigate('/staff/stock-check')}
          >
            <IconClipboard size={16} /> Stock Check
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stat Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* Card 1: My Assigned Tasks */}
        <div className="clay-stat-card" onClick={() => navigate('/staff')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">ASSIGNED TASKS</span>
            <span className="clay-stat-card__value">{tasks.length}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Floor duties pending</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconClipboard size={22} />
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div className="clay-stat-card" onClick={() => navigate('/staff/medicines')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">LOW STOCK ALERTS</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>{lowStockCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Depletion alerts</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* Card 3: Near Expiry Alerts */}
        <div className="clay-stat-card" onClick={() => navigate('/staff/expiry')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">NEAR EXPIRY ALERTS</span>
            <span className="clay-stat-card__value" style={{ color: '#ef4444' }}>{nearExpiryCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Within 30 days</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconClock size={22} />
          </div>
        </div>

        {/* Card 4: Today's Deliveries */}
        <div className="clay-stat-card" onClick={() => navigate('/staff/receive')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TODAY'S DELIVERIES</span>
            <span className="clay-stat-card__value" style={{ color: '#008C8C' }}>{pendingDeliveriesCount}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Awaiting check-in</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconTruck size={22} />
          </div>
        </div>
      </div>

      {/* ── Staff AI Assistant Interactive Banner ── */}
      <div
        className="staff-ai-banner"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #e6fffa 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          marginBottom: 20,
          border: '1px solid #bbf7d0',
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              color: '#ffffff'
            }}
          >
            <IconSparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: '#065f46' }}>
                Staff Pharmacy AI Assistant
              </h3>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontWeight: 700, border: '1px solid #86efac' }}>
                Operational Scope
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#047857' }}>
              Ask questions about medicine stock, shelf bins, 7-day expiry alerts, and your daily assigned floor tasks.
            </p>
          </div>
        </div>

        {/* Quick query chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="staff-btn staff-btn--sm"
            style={{ background: '#ffffff', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'What is the available stock of Paracetamol?' } }))}
          >
            💊 Paracetamol Stock
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--sm"
            style={{ background: '#ffffff', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'Which medicine batches expire in the next 7 days?' } }))}
          >
            ⏰ 7-Day Expiries
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--sm"
            style={{ background: '#ffffff', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'What operational tasks are assigned to me today?' } }))}
          >
            📋 My Floor Tasks
          </button>
          <button
            type="button"
            className="staff-btn"
            style={{ background: '#10b981', color: '#ffffff', border: 'none', padding: '7px 16px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', {}))}
          >
            <IconSparkles size={16} />
            <span>Open AI Chat</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: Middle 3-Column Section ── */}
      <div className="staff-3col-layout">
        {/* Col 1: Inventory Alerts (Wide Table) */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-kpi-icon-box--orange" style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconAlertTriangle size={15} />
              </span>
              <h3 className="staff-card-title">Inventory Alerts</h3>
            </div>
            <Link to="/staff/medicines" className="staff-card-header-link">
              View All &rarr;
            </Link>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Batch No.</th>
                  <th>Qty. Available</th>
                  <th>Status</th>
                  <th>Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {alertList.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td style={{ color: '#64748B' }}>{item.batch}</td>
                    <td style={{ fontWeight: 600 }}>{item.qty}</td>
                    <td>
                      <span className={`staff-badge staff-badge--${item.status.toLowerCase().replace(/\s+/g, '')}`}>
                        <span className="staff-badge-dot"></span>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748B' }}>{item.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 2: Stock Overview (Donut Chart) */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconPackage size={18} />
              </span>
              <h3 className="staff-card-title">Stock Overview</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <div className="staff-donut-container">
              <div className="staff-donut-chart-wrap">
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="13" />
                  {/* Segment: Out of Stock (5.6%) - Coral Red */}
                  <circle
                    cx="50" cy="50" r="38"
                    fill="transparent"
                    stroke="#EF4444"
                    strokeWidth="13"
                    strokeDasharray="14 225"
                    strokeDashoffset="0"
                  />
                  {/* Segment: Low Stock (12.1%) - Amber */}
                  <circle
                    cx="50" cy="50" r="38"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="13"
                    strokeDasharray="29 210"
                    strokeDashoffset="-14"
                  />
                  {/* Segment: Available (82.3%) - Teal */}
                  <circle
                    cx="50" cy="50" r="38"
                    fill="transparent"
                    stroke="#008C8C"
                    strokeWidth="13"
                    strokeDasharray="196 43"
                    strokeDashoffset="-43"
                  />
                </svg>
                <div className="staff-donut-center-label">
                  <div className="staff-donut-center-sub">Total Stock</div>
                  <div className="staff-donut-center-num">{totalStockCount.toLocaleString()}</div>
                  <div className="staff-donut-center-sub" style={{ textTransform: 'lowercase' }}>units</div>
                </div>
              </div>
              <div className="staff-donut-legend">
                <div className="staff-donut-legend-item">
                  <div className="staff-donut-legend-left">
                    <span className="staff-donut-legend-color" style={{ background: '#008C8C' }}></span>
                    <span>Available</span>
                  </div>
                  <span className="staff-donut-legend-val">{Math.max(0, totalStockCount - lowStockCount)}</span>
                </div>
                <div className="staff-donut-legend-item">
                  <div className="staff-donut-legend-left">
                    <span className="staff-donut-legend-color" style={{ background: '#F59E0B' }}></span>
                    <span>Low Stock</span>
                  </div>
                  <span className="staff-donut-legend-val">{lowStockCount}</span>
                </div>
                <div className="staff-donut-legend-item">
                  <div className="staff-donut-legend-left">
                    <span className="staff-donut-legend-color" style={{ background: '#EF4444' }}></span>
                    <span>Out of Stock</span>
                  </div>
                  <span className="staff-donut-legend-val">{outOfStockCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Daily Operations (List Metrics) */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconActivity size={18} />
              </span>
              <h3 className="staff-card-title">Daily Operations</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <div className="staff-ops-list">
              <div className="staff-ops-item">
                <div className="staff-ops-left">
                  <IconPill size={16} color="#0D9488" />
                  <span>Total Medicines</span>
                </div>
                <span className="staff-ops-val">{medicines.length}</span>
              </div>
              <div className="staff-ops-item">
                <div className="staff-ops-left">
                  <IconFolder size={16} color="#0284C7" />
                  <span>Total Categories</span>
                </div>
                <span className="staff-ops-val">{categories.length}</span>
              </div>
              <div className="staff-ops-item">
                <div className="staff-ops-left">
                  <IconTruck size={16} color="#475569" />
                  <span>Total Suppliers</span>
                </div>
                <span className="staff-ops-val">{suppliers.length}</span>
              </div>
              <div className="staff-ops-item">
                <div className="staff-ops-left">
                  <IconClipboard size={16} color="#2563EB" />
                  <span>Pending Receipts</span>
                </div>
                <span className="staff-ops-val">{pendingDeliveriesCount}</span>
              </div>
              <div className="staff-ops-item">
                <div className="staff-ops-left">
                  <IconCalendar size={16} color="#DC2626" />
                  <span>Expiry This Week</span>
                </div>
                <span className="staff-ops-val">{nearExpiryCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Bottom 3-Column Section ── */}
      <div className="staff-3col-layout">
        {/* Col 1: Recent Medicines (Wide Table) */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconPill size={18} />
              </span>
              <h3 className="staff-card-title">Recent Medicines</h3>
            </div>
            <Link to="/staff/medicines" className="staff-card-header-link">
              View All &rarr;
            </Link>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Available Qty</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentMeds.map((med, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{med.name}</td>
                    <td style={{ color: '#64748B' }}>{med.category}</td>
                    <td style={{ fontWeight: 600 }}>{med.qty}</td>
                    <td style={{ color: '#64748B' }}>{med.expiry}</td>
                    <td>
                      <span className={`staff-badge staff-badge--${med.status.toLowerCase().replace(/\s+/g, '')}`}>
                        <span className="staff-badge-dot"></span>
                        {med.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 2: Your Recent Activity */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconClock size={18} />
              </span>
              <h3 className="staff-card-title">Your Recent Activity</h3>
            </div>
            <span className="staff-card-header-link">View All</span>
          </div>
          <div className="staff-card-body">
            <div className="staff-timeline">
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  <IconPill size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Viewed medicine details</span>
                  <span className="staff-timeline-sub">Paracetamol 500mg &bull; 2 hours ago</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#CCFBF1', color: '#0F766E' }}>
                  <IconClipboard size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Checked stock</span>
                  <span className="staff-timeline-sub">Amoxicillin 250mg &bull; 3 hours ago</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                  <IconCheckCircle size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Updated stock count</span>
                  <span className="staff-timeline-sub">Metformin 500mg &bull; 5 hours ago</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                  <IconAlertTriangle size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Viewed expiry alerts</span>
                  <span className="staff-timeline-sub">3 medicines &bull; 6 hours ago</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#E2E8F0', color: '#475569' }}>
                  <IconUser size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Logged in to system</span>
                  <span className="staff-timeline-sub">Staff Portal &bull; Today, 08:15 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3: Quick Actions */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon" style={{ color: '#0A6663' }}>
                <IconActivity size={18} />
              </span>
              <h3 className="staff-card-title">Quick Actions</h3>
            </div>
          </div>
          <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="staff-btn staff-btn--full" style={{ justifyContent: 'flex-start', padding: '11px 14px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontWeight: 700 }} onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', {}))}>
              <IconSparkles size={17} color="#16a34a" />
              <span>Ask Staff AI Assistant</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start', padding: '11px 14px' }} onClick={() => navigate('/staff/medicines')}>
              <IconPill size={17} color="#0D9488" />
              <span>View Medicines</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start', padding: '11px 14px' }} onClick={() => navigate('/staff/search')}>
              <IconSearch size={17} color="#0284C7" />
              <span>Search Medicines</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start', padding: '11px 14px' }} onClick={() => navigate('/staff/stock-check')}>
              <IconClipboard size={17} color="#059669" />
              <span>Check Stock</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start', padding: '11px 14px' }} onClick={() => navigate('/staff/receive')}>
              <IconTruck size={17} color="#D97706" />
              <span>Receive Medicines</span>
            </button>
            <button className="staff-btn staff-btn--outline staff-btn--full" style={{ justifyContent: 'flex-start', padding: '11px 14px' }} onClick={() => navigate('/staff/expiry')}>
              <IconCalendar size={17} color="#DC2626" />
              <span>View Expiry Alerts</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Callout Banner ── */}
      <div className="staff-info-banner">
        <IconInfo size={20} className="staff-info-banner-icon" />
        <div>
          <strong>Important Information</strong>
          <p style={{ margin: '3px 0 0 0', color: '#1E3A8A' }}>
            Please check expiry dates for medicines expiring within 7 days. Report any discrepancies in stock count to the pharmacist.
          </p>
        </div>
      </div>
    </div>
  );
}
