import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconDashboard,
  IconTruck,
  IconOrders,
  IconPill,
  IconCheckCircle,
  IconClock,
  IconAlertTriangle,
  IconPackage,
  IconRefresh,
  IconDownload,
  IconEye,
  IconSend,
  IconInfo,
  IconFileText,
  IconHistory,
  IconSparkles,
  IconBell,
  IconX,
  IconFilter,
  IconSearch,
  IconShield
} from '../../components/icons/Icons';
import {
  fetchDashboardStats,
  fetchOrders,
  fetchMedicines,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../services/api';
import { wsService } from '../../services/websocket';
import '../staff/StaffCommon.css';
import './SupplierDashboardPage.css';

// Seed Notifications tailored specifically for wholesale pharmaceutical suppliers
const SEED_SUPPLIER_ALERTS = [
  {
    id: 101,
    title: 'New PO Received: PO-2025-0048',
    message: 'Central Pharmacy generated PO-2025-0048 (5 items, ₹ 42,500). Please review and dispatch.',
    category: 'ORDERS',
    priority: 'HIGH',
    time: '25m ago',
    read: false,
    poNumber: 'PO-2025-0048',
    actionLink: '/supplier/orders',
    actionText: 'View PO'
  },
  {
    id: 102,
    title: 'Consignment Verified: PO-2025-0046',
    message: 'Consignment PO-2025-0046 (12 items) verified and received at central receiving dock.',
    category: 'DELIVERIES',
    priority: 'MEDIUM',
    time: '2h ago',
    read: false,
    poNumber: 'PO-2025-0046',
    actionLink: '/supplier/history',
    actionText: 'Receipt'
  },
  {
    id: 103,
    title: 'Cold Chain Temperature Reminder',
    message: 'Carrier #DHL-99214 requires digital cold chain logs (2°C – 8°C) attached upon hospital delivery.',
    category: 'COMPLIANCE',
    priority: 'HIGH',
    time: '5h ago',
    read: false,
    poNumber: 'PO-2025-0048',
    actionLink: '/supplier/deliveries',
    actionText: 'Update'
  },
  {
    id: 104,
    title: 'Catalog Stock Buffer Low',
    message: 'Omeprazole 20mg (SKU: APX-OMP-020) buffer supply is low at pharmacy. Restock expected.',
    category: 'STOCK',
    priority: 'MEDIUM',
    time: '12h ago',
    read: true,
    actionLink: '/supplier/orders',
    actionText: 'Review POs'
  },
  {
    id: 105,
    title: 'Good Distribution Practice Approved',
    message: 'Annual vendor quality audit confirmed with 98.4% rating score for 2026.',
    category: 'COMPLIANCE',
    priority: 'LOW',
    time: '1d ago',
    read: true,
    actionLink: '/supplier',
    actionText: 'Rating'
  }
];

export default function SupplierDashboardPage() {
  const navigate = useNavigate();
  const defaultRecentOrders = useMemo(() => [
    { id: 1, poNumber: 'PO-2025-0048', date: '2025-04-28', items: 5, value: '₹ 42,500', expected: '2025-04-30', status: 'Pending' },
    { id: 2, poNumber: 'PO-2025-0047', date: '2025-04-26', items: 8, value: '₹ 86,200', expected: '2025-04-29', status: 'In Transit' },
    { id: 3, poNumber: 'PO-2025-0046', date: '2025-04-24', items: 12, value: '₹ 1,24,000', expected: '2025-04-27', status: 'Delivered' },
    { id: 4, poNumber: 'PO-2025-0045', date: '2025-04-22', items: 6, value: '₹ 58,400', expected: '2025-04-25', status: 'Delivered' },
    { id: 5, poNumber: 'PO-2025-0044', date: '2025-04-20', items: 4, value: '₹ 31,800', expected: '2025-04-23', status: 'Partially Shipped' }
  ], []);

  const defaultSuppliedMeds = useMemo(() => [
    { name: 'Paracetamol 500mg', sku: 'APX-PCT-500', category: 'Analgesics', price: '₹ 5.20', leadTime: '2 Days', status: 'In Stock' },
    { name: 'Amoxicillin 250mg', sku: 'APX-AMX-250', category: 'Antibiotics', price: '₹ 12.50', leadTime: '3 Days', status: 'In Stock' },
    { name: 'Omeprazole 20mg', sku: 'APX-OMP-020', category: 'Gastrointestinal', price: '₹ 18.75', leadTime: '2 Days', status: 'Low Supply' },
    { name: 'Atorvastatin 10mg', sku: 'APX-ATV-010', category: 'Cardiovascular', price: '₹ 32.00', leadTime: '4 Days', status: 'In Stock' },
    { name: 'Metformin 500mg', sku: 'APX-MET-500', category: 'Diabetes', price: '₹ 8.90', leadTime: '2 Days', status: 'In Stock' }
  ], []);

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([
    { id: 1, poNumber: 'PO-2025-0048', date: '2025-04-28', items: 5, value: '₹ 42,500', expected: '2025-04-30', status: 'Pending' },
    { id: 2, poNumber: 'PO-2025-0047', date: '2025-04-26', items: 8, value: '₹ 86,200', expected: '2025-04-29', status: 'In Transit' },
    { id: 3, poNumber: 'PO-2025-0046', date: '2025-04-24', items: 12, value: '₹ 1,24,000', expected: '2025-04-27', status: 'Delivered' },
    { id: 4, poNumber: 'PO-2025-0045', date: '2025-04-22', items: 6, value: '₹ 58,400', expected: '2025-04-25', status: 'Delivered' },
    { id: 5, poNumber: 'PO-2025-0044', date: '2025-04-20', items: 4, value: '₹ 31,800', expected: '2025-04-23', status: 'Partially Shipped' }
  ]);
  const [medicines, setMedicines] = useState([
    { name: 'Paracetamol 500mg', sku: 'APX-PCT-500', category: 'Analgesics', price: '₹ 5.20', leadTime: '2 Days', status: 'In Stock' },
    { name: 'Amoxicillin 250mg', sku: 'APX-AMX-250', category: 'Antibiotics', price: '₹ 12.50', leadTime: '3 Days', status: 'In Stock' },
    { name: 'Omeprazole 20mg', sku: 'APX-OMP-020', category: 'Gastrointestinal', price: '₹ 18.75', leadTime: '2 Days', status: 'Low Supply' },
    { name: 'Atorvastatin 10mg', sku: 'APX-ATV-010', category: 'Cardiovascular', price: '₹ 32.00', leadTime: '4 Days', status: 'In Stock' },
    { name: 'Metformin 500mg', sku: 'APX-MET-500', category: 'Diabetes', price: '₹ 8.90', leadTime: '2 Days', status: 'In Stock' }
  ]);
  const [notifications, setNotifications] = useState(SEED_SUPPLIER_ALERTS);
  const [unreadCount, setUnreadCount] = useState(3);
  const [loading, setLoading] = useState(false);

  // Notification Sidebar Widget State
  const [notifTab, setNotifTab] = useState('ALL');

  // Slide-out Notification Sidebar Drawer State
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [drawerCat, setDrawerCat] = useState('ALL');

  // Live formatted date & time
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDateTime(now.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }));
    };
    updateDateTime();
    const timer = setInterval(updateDateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsData, ordersData, medsData, notifsData] = await Promise.all([
        fetchDashboardStats().catch(() => null),
        fetchOrders().catch(() => []),
        fetchMedicines().catch(() => []),
        fetchNotifications().catch(() => [])
      ]);
      setStats(statsData);
      setOrders(Array.isArray(ordersData) && ordersData.length > 0 ? ordersData : defaultRecentOrders);
      setMedicines(Array.isArray(medsData) && medsData.length > 0 ? medsData : defaultSuppliedMeds);

      if (Array.isArray(notifsData) && notifsData.length > 0) {
        const mapped = notifsData.map((n, i) => ({
          id: n.notificationId || (200 + i),
          title: n.title || 'System Notification',
          message: n.message || n.content || '',
          category: n.relatedEntityType === 'PURCHASE_ORDER' ? 'ORDERS' : n.notificationType === 'LOW_STOCK' ? 'STOCK' : 'COMPLIANCE',
          priority: n.priority || 'MEDIUM',
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          read: Boolean(n.read),
          poNumber: n.relatedEntityType === 'PURCHASE_ORDER' ? 'PO-2025-0048' : null,
          actionLink: n.relatedEntityType === 'PURCHASE_ORDER' ? '/supplier/orders' : '/supplier/deliveries',
          actionText: n.relatedEntityType === 'PURCHASE_ORDER' ? 'View PO' : 'View'
        }));

        const merged = [...mapped];
        for (const s of SEED_SUPPLIER_ALERTS) {
          if (!merged.some(m => m.id === s.id || m.title === s.title)) {
            merged.push(s);
          }
        }
        setNotifications(merged);
        setUnreadCount(merged.filter(n => !n.read).length);
      } else {
        setNotifications(SEED_SUPPLIER_ALERTS);
        setUnreadCount(SEED_SUPPLIER_ALERTS.filter(n => !n.read).length);
      }
    } catch (_err) {
      setOrders(defaultRecentOrders);
      setMedicines(defaultSuppliedMeds);
      setNotifications(SEED_SUPPLIER_ALERTS);
      setUnreadCount(SEED_SUPPLIER_ALERTS.filter(n => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for real-time WebSocket push notifications
    const unsub = wsService.subscribeNotifications((evt) => {
      const notifData = evt?.data || evt;
      if (notifData && (notifData.title || notifData.message)) {
        const newNotif = {
          id: notifData.notificationId || Date.now(),
          title: notifData.title || 'Live Supplier Alert',
          message: notifData.message || 'New vendor update received',
          category: 'ORDERS',
          priority: 'HIGH',
          time: 'Just now',
          read: false,
          actionLink: '/supplier/orders',
          actionText: 'View'
        };
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(c => c + 1);
      }
    });

    return () => unsub();
  }, [loadData]);

  const handleMarkNotifRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id).catch(() => null);
    } catch (_e) {}
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handleMarkAllNotifsRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await markAllNotificationsRead().catch(() => null);
    } catch (_e) {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (item) => {
    if (!item.read) handleMarkNotifRead(item.id);
    if (item.actionLink) {
      navigate(item.actionLink);
    }
  };

  // Filtered notifications for the in-page sidebar widget
  const displayedNotifs = useMemo(() => {
    return notifications.filter(n => {
      if (notifTab === 'ALL') return true;
      if (notifTab === 'ORDERS') return n.category === 'ORDERS';
      if (notifTab === 'DELIVERIES') return n.category === 'DELIVERIES';
      if (notifTab === 'ALERTS') return n.category === 'COMPLIANCE' || n.category === 'STOCK';
      return true;
    }).slice(0, 5);
  }, [notifications, notifTab]);

  // Filtered notifications for the slide-out drawer
  const drawerNotifs = useMemo(() => {
    return notifications.filter(n => {
      const matchCat = drawerCat === 'ALL' || n.category === drawerCat;
      const q = drawerSearch.toLowerCase();
      const matchSearch = !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [notifications, drawerCat, drawerSearch]);

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered') || s.includes('received') || s.includes('stock')) return 'staff-badge--received';
    if (s.includes('transit') || s.includes('progress')) return 'staff-badge--inprogress';
    if (s.includes('pending') || s.includes('supply')) return 'staff-badge--warning';
    return 'staff-badge--neutral';
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Universal Supplier Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Supplier Portal</h1>
          <p className="admin-dash-sub">
            Authorized vendor dispatch, order fulfillment, and contracted pharmaceutical medicine catalog.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            onClick={() => setIsNotifDrawerOpen(true)}
            title="Toggle Notifications Sidebar Drawer"
            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconBell size={16} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  marginLeft: 2
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button className="clay-action-pill-btn clay-action-pill-btn--secondary" onClick={loadData}>
            <IconRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Row 1: 4 Clay KPI Cards ── */}
      <div className="clay-stat-grid-4">
        {/* Card 1: Active Purchase Orders */}
        <Link to="/supplier/orders" className="clay-stat-card" style={{ textDecoration: 'none' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Active Orders</span>
            <div className="clay-stat-card__value">{orders.filter(o => o.status !== 'Delivered').length}</div>
            <span className="clay-stat-card__sub" style={{ color: '#0284C7', fontWeight: 600 }}>Awaiting dispatch &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconOrders size={22} />
          </div>
        </Link>

        {/* Card 2: In Transit Shipments */}
        <Link to="/supplier/deliveries" className="clay-stat-card" style={{ textDecoration: 'none' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">In Transit</span>
            <div className="clay-stat-card__value" style={{ color: '#EA580C' }}>{orders.filter(o => (o.status || '').toLowerCase().includes('transit')).length}</div>
            <span className="clay-stat-card__sub" style={{ color: '#EA580C', fontWeight: 600 }}>Track carrier &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconTruck size={22} />
          </div>
        </Link>

        {/* Card 3: Notifications & Alerts */}
        <Link to="/supplier/notifications" className="clay-stat-card" style={{ textDecoration: 'none' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Notifications</span>
            <div className="clay-stat-card__value" style={{ color: '#008C8C' }}>{notifications.length}</div>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C', fontWeight: 600 }}>{unreadCount} unread alerts &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconBell size={22} />
          </div>
        </Link>

        {/* Card 4: Fulfilled This Month */}
        <Link to="/supplier/history" className="clay-stat-card" style={{ textDecoration: 'none' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Fulfilled This Month</span>
            <div className="clay-stat-card__value" style={{ color: '#16A34A' }}>{orders.filter(o => (o.status || '').toLowerCase().includes('delivered')).length}</div>
            <span className="clay-stat-card__sub" style={{ color: '#16A34A', fontWeight: 600 }}>100% SLA compliance &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconCheckCircle size={22} />
          </div>
        </Link>
      </div>

      {/* ── Wholesale Supplier AI Assistant Interactive Banner ── */}
      <div
        className="supplier-ai-banner"
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdfa 50%, #e0f2fe 100%)',
          borderRadius: 16,
          padding: '16px 20px',
          marginTop: 20,
          marginBottom: 20,
          border: '1px solid #bfdbfe',
          boxShadow: '0 4px 16px rgba(37, 99, 235, 0.08)',
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
              background: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              color: '#ffffff'
            }}
          >
            <IconSparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, color: '#1e3a8a' }}>
                Supplier Wholesale AI Assistant
              </h3>
              <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 12, background: '#dbeafe', color: '#1e40af', fontWeight: 700, border: '1px solid #93c5fd' }}>
                Vendor Portal Scope
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#1d4ed8' }}>
              Inquire about your active purchase orders, delivery progress, goods receipts, and contracted medicine items.
            </p>
          </div>
        </div>

        {/* Quick query chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="staff-btn staff-btn--sm"
            style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'List my active purchase orders' } }))}
          >
            📦 Active POs
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--sm"
            style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'What orders are currently pending delivery?' } }))}
          >
            🚚 Pending Deliveries
          </button>
          <button
            type="button"
            className="staff-btn staff-btn--sm"
            style={{ background: '#ffffff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '0.78rem', fontWeight: 600, padding: '6px 12px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'Show my supplier company summary' } }))}
          >
            🏢 Company Summary
          </button>
          <button
            type="button"
            className="staff-btn"
            style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '7px 16px', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', {}))}
          >
            <IconSparkles size={16} />
            <span>Open Supplier AI</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Recent Orders (Left) + Live Status & Policy (Right) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        {/* Left: Recent Purchase Orders Table */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--blue" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconOrders size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Recent Purchase Orders</h3>
            </div>
            <Link to="/supplier/orders" style={{ fontSize: '0.84rem', color: '#008C8C', fontWeight: 600, textDecoration: 'none' }}>
              View All &rarr;
            </Link>
          </div>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Order Date</th>
                  <th>Items</th>
                  <th>Total Value</th>
                  <th>Expected Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
                      No purchase orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  orders.slice(0, 5).map((po) => (
                    <tr key={po.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#008C8C' }}>
                        {po.poNumber}
                      </td>
                      <td style={{ color: '#64748B' }}>{po.date}</td>
                      <td style={{ fontWeight: 600 }}>{po.items} items</td>
                      <td style={{ fontWeight: 700, color: '#16324F' }}>{po.value}</td>
                      <td style={{ color: '#64748B' }}>{po.expected}</td>
                      <td>
                        <span className={`staff-badge ${getStatusBadge(po.status)}`}>
                          <span className="staff-badge-dot"></span>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Notification Sidebar, Live Dispatch Status & Vendor Compliance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* ── 1. Notification Sidebar Widget ── */}
          <div className="clay-side-widget" id="supplier-notification-sidebar">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 34, height: 34, minWidth: 34 }}>
                  <IconBell size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>
                    Notifications
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                    {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="staff-btn staff-btn--sm"
                    style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 12, cursor: 'pointer' }}
                    onClick={handleMarkAllNotifsRead}
                    title="Mark all notifications as read"
                  >
                    Mark read
                  </button>
                )}
                <Link
                  to="/supplier/notifications"
                  style={{ fontSize: '0.78rem', color: '#008C8C', fontWeight: 700, textDecoration: 'none' }}
                >
                  All &rarr;
                </Link>
              </div>
            </div>

            {/* Filter Chips Strip */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'ORDERS', label: 'Orders' },
                { key: 'DELIVERIES', label: 'Dispatches' },
                { key: 'ALERTS', label: 'Alerts' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNotifTab(key)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 14,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: notifTab === key ? '#008C8C' : '#f1f5f9',
                    color: notifTab === key ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Notification Items List */}
            <div className="staff-timeline" style={{ maxHeight: 310, overflowY: 'auto' }}>
              {displayedNotifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8', fontSize: '0.82rem' }}>
                  No notifications in this category.
                </div>
              ) : (
                displayedNotifs.map((item) => (
                  <div
                    key={item.id}
                    className="staff-timeline-item"
                    onClick={() => handleNotificationClick(item)}
                    style={{
                      cursor: 'pointer',
                      background: !item.read ? 'rgba(0, 140, 140, 0.05)' : 'transparent',
                      padding: '8px 10px',
                      borderRadius: 10,
                      borderLeft: !item.read ? '3px solid #008C8C' : '3px solid transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div
                      className="staff-timeline-icon"
                      style={{
                        background: item.category === 'ORDERS' ? '#E0F2FE' : item.category === 'DELIVERIES' ? '#DCFCE7' : '#FEF3C7',
                        color: item.category === 'ORDERS' ? '#0284C7' : item.category === 'DELIVERIES' ? '#16A34A' : '#D97706',
                        width: 28,
                        height: 28,
                        minWidth: 28
                      }}
                    >
                      {item.category === 'ORDERS' ? <IconOrders size={14} /> : item.category === 'DELIVERIES' ? <IconTruck size={14} /> : <IconAlertTriangle size={14} />}
                    </div>
                    <div className="staff-timeline-content" style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="staff-timeline-title" style={{ fontSize: '0.83rem', fontWeight: item.read ? 600 : 800 }}>
                          {item.title}
                        </span>
                        {!item.read && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
                        )}
                      </div>
                      <span className="staff-timeline-sub" style={{ fontSize: '0.73rem', color: '#64748B', lineHeight: 1.3 }}>
                        {item.message}
                      </span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{item.time}</span>
                        {item.actionText && (
                          <span style={{ fontSize: '0.72rem', color: '#008C8C', fontWeight: 700 }}>
                            {item.actionText} &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Sidebar Footer Link */}
            <div style={{ borderTop: '1px solid #eef3f8', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="staff-btn staff-btn--sm"
                style={{ background: 'transparent', border: 'none', color: '#008C8C', fontSize: '0.78rem', fontWeight: 700, padding: 0, cursor: 'pointer' }}
                onClick={() => setIsNotifDrawerOpen(true)}
              >
                Open Full Drawer ↗
              </button>
              <Link
                to="/supplier/notifications"
                style={{ fontSize: '0.78rem', color: '#64748B', textDecoration: 'none', fontWeight: 600 }}
              >
                Notifications Center &rarr;
              </Link>
            </div>
          </div>

          {/* ── 2. Live Dispatch Status ── */}
          <div className="clay-side-widget">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 32, height: 32, minWidth: 32 }}>
                  <IconTruck size={16} />
                </div>
                <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Live Dispatch Status</h3>
              </div>
              <Link to="/supplier/deliveries" style={{ fontSize: '0.78rem', color: '#008C8C', fontWeight: 600, textDecoration: 'none' }}>
                All &rarr;
              </Link>
            </div>
            <div className="staff-timeline">
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                  <IconTruck size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">PO-2025-0048 Dispatched</span>
                  <span className="staff-timeline-sub">DHL Medical &bull; Tracking #DHL-99214 &bull; 2 hours ago</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                  <IconCheckCircle size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">PO-2025-0046 Delivered</span>
                  <span className="staff-timeline-sub">Verified by Central Pharmacy &bull; Yesterday</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <IconFileText size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Packing Slip Generated</span>
                  <span className="staff-timeline-sub">PO-2025-0047 (8 items) &bull; Apr 26</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div className="staff-timeline-icon" style={{ background: '#E2E8F0', color: '#475569' }}>
                  <IconOrders size={15} />
                </div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">PO Received</span>
                  <span className="staff-timeline-sub">PO-2025-0048 Central Pharmacy</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Vendor Compliance Card ── */}
          <div className="clay-side-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--amber" style={{ width: 32, height: 32, minWidth: 32 }}>
                <IconAlertTriangle size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Vendor Compliance</h3>
            </div>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              All consignments require digital batch release certificates and cold chain temperature logs upon hospital arrival.
            </p>
            <div className="staff-ops-list">
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Vendor Code</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#16324F' }}>APEX-PHARMA</span>
              </div>
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Contract Status</span>
                <span className="staff-badge staff-badge--active">Active</span>
              </div>
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Procurement SLA</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>96 Hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Callout Banner (Clay) ── */}
      <div className="clay-side-widget" style={{ flexDirection: 'row', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, #e6f6f6 0%, #f0fdf4 100%)', borderColor: '#bbf7d0', marginTop: 16 }}>
        <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 40, height: 40, minWidth: 40 }}>
          <IconInfo size={20} />
        </div>
        <div>
          <strong style={{ color: '#0f4a47', fontSize: '0.92rem' }}>Important Cold Chain Dispatch Notice</strong>
          <p style={{ margin: '3px 0 0 0', color: '#16324f', fontSize: '0.84rem', lineHeight: 1.4 }}>
            Please ensure all pharmaceutical dispatches adhere to standard Cold Chain storage regulations (2°C – 8°C). Update dispatch tracking numbers within 4 hours of carrier pickup.
          </p>
        </div>
      </div>

      {/* ── Slide-Out Notification Sidebar Drawer ── */}
      {isNotifDrawerOpen && (
        <div className="supplier-notif-drawer-overlay" onClick={() => setIsNotifDrawerOpen(false)}>
          <div className="supplier-notif-drawer" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="supplier-notif-drawer__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 36, height: 36, minWidth: 36 }}>
                  <IconBell size={18} />
                </div>
                <div>
                  <h3 className="supplier-notif-drawer__title">
                    Supplier Notifications
                    {unreadCount > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>
                        {unreadCount}
                      </span>
                    )}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Vendor Portal Real-time Feed</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="staff-btn staff-btn--sm"
                    style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '0.72rem', fontWeight: 700, padding: '4px 8px', borderRadius: 12, cursor: 'pointer' }}
                    onClick={handleMarkAllNotifsRead}
                  >
                    Mark Read
                  </button>
                )}
                <button
                  className="supplier-notif-drawer__close"
                  onClick={() => setIsNotifDrawerOpen(false)}
                  aria-label="Close notification drawer"
                >
                  <IconX size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Search */}
            <div style={{ padding: '12px 20px 0 20px' }}>
              <div style={{ position: 'relative' }}>
                <IconSearch size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Filter notifications..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    fontSize: '0.82rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Filter Pills Strip */}
            <div className="supplier-notif-drawer__filter-strip">
              {['ALL', 'ORDERS', 'DELIVERIES', 'COMPLIANCE', 'STOCK'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDrawerCat(cat)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 14,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: drawerCat === cat ? '#008C8C' : '#f1f5f9',
                    color: drawerCat === cat ? '#ffffff' : '#475569',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat === 'ALL' ? 'All' : cat === 'ORDERS' ? 'Orders' : cat === 'DELIVERIES' ? 'Dispatches' : cat === 'COMPLIANCE' ? 'Compliance' : 'Stock'}
                </button>
              ))}
            </div>

            {/* Drawer Items Body */}
            <div className="supplier-notif-drawer__body">
              {drawerNotifs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                  <IconCheckCircle size={32} color="#10b981" style={{ marginBottom: 6 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>No notifications found matching filter.</p>
                </div>
              ) : (
                drawerNotifs.map((n) => (
                  <div
                    key={n.id}
                    className={`supplier-notif-card ${!n.read ? 'supplier-notif-card--unread' : ''}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div
                      className="staff-timeline-icon"
                      style={{
                        background: n.category === 'ORDERS' ? '#E0F2FE' : n.category === 'DELIVERIES' ? '#DCFCE7' : '#FEF3C7',
                        color: n.category === 'ORDERS' ? '#0284C7' : n.category === 'DELIVERIES' ? '#16A34A' : '#D97706',
                        width: 32,
                        height: 32,
                        minWidth: 32
                      }}
                    >
                      {n.category === 'ORDERS' ? <IconOrders size={16} /> : n.category === 'DELIVERIES' ? <IconTruck size={16} /> : <IconAlertTriangle size={16} />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: n.read ? 600 : 800, color: '#16324F' }}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0284c7', marginTop: 4, flexShrink: 0 }} />
                        )}
                      </div>
                      <p style={{ margin: '4px 0 8px 0', fontSize: '0.78rem', color: '#475569', lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{n.time}</span>
                        {n.actionText && (
                          <span style={{ fontSize: '0.74rem', color: '#008C8C', fontWeight: 700 }}>
                            {n.actionText} &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer */}
            <div className="supplier-notif-drawer__footer">
              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                {notifications.length} total notices
              </span>
              <button
                type="button"
                className="clay-action-pill-btn clay-action-pill-btn--primary"
                style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                onClick={() => {
                  setIsNotifDrawerOpen(false);
                  navigate('/supplier/notifications');
                }}
              >
                Open Full Center &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
