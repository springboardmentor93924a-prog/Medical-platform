import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBell,
  IconCheckCircle,
  IconAlertTriangle,
  IconSearch,
  IconClock,
  IconPackage,
  IconDownload,
  IconCheck,
  IconOrders,
  IconTruck,
  IconPill,
  IconFilter,
  IconRefresh,
  IconShield,
  IconChevronRight,
  IconEye,
  IconSparkles,
  IconMail
} from '../../components/icons/Icons';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/api';
import { wsService } from '../../services/websocket';
import { exportToCsv } from '../../utils/csvExport';
import EmailPreferencesPanel from '../../components/notifications/EmailPreferencesPanel';
import '../staff/StaffCommon.css';
import './SupplierDashboardPage.css';

// Seed Notifications tailored specifically for wholesale pharmaceutical suppliers
const SEED_SUPPLIER_NOTIFICATIONS = [
  {
    id: 101,
    title: 'New Purchase Order Received: PO-2025-0048',
    message: 'Central Pharmacy Hospital has generated PO-2025-0048 for 5 items (₹ 42,500). Please review and dispatch before April 30, 2025.',
    category: 'ORDERS',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    read: false,
    poNumber: 'PO-2025-0048',
    actionLink: '/supplier/orders',
    actionText: 'View Purchase Order'
  },
  {
    id: 102,
    title: 'Delivery Confirmed & Verified: PO-2025-0046',
    message: 'Consignment for PO-2025-0046 (12 items) received at hospital goods dock and verified by Central Pharmacy receiving staff.',
    category: 'DELIVERIES',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    read: false,
    poNumber: 'PO-2025-0046',
    actionLink: '/supplier/history',
    actionText: 'View Delivery Receipt'
  },
  {
    id: 103,
    title: 'Cold Chain Compliance Requirement',
    message: 'Carrier tracking #DHL-99214 requires digital cold chain temperature logs (2°C – 8°C) attached to shipment manifesto upon hospital check-in.',
    category: 'COMPLIANCE',
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 320 * 60 * 1000).toISOString(),
    read: false,
    poNumber: 'PO-2025-0048',
    actionLink: '/supplier/deliveries',
    actionText: 'Update Dispatch Details'
  },
  {
    id: 104,
    title: 'Contracted Medicine Stock Depletion Warning',
    message: 'Omeprazole 20mg (SKU: APX-OMP-020) buffer supply is currently low at Central Pharmacy. An automatic replenishment PO may follow.',
    category: 'STOCK',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 720 * 60 * 1000).toISOString(),
    read: true,
    actionLink: '/supplier/orders',
    actionText: 'Review Active POs'
  },
  {
    id: 105,
    title: 'Annual Good Distribution Practice (GDP) Approved',
    message: 'Apex Pharma wholesale distributor quality audit has been verified by MediStock compliance board. Score: 98.4%.',
    category: 'COMPLIANCE',
    priority: 'LOW',
    createdAt: new Date(Date.now() - 1800 * 60 * 1000).toISOString(),
    read: true,
    actionLink: '/supplier',
    actionText: 'Review Vendor Rating'
  },
  {
    id: 106,
    title: 'Packing Slip Generated: PO-2025-0047',
    message: 'Packing slip for 8 antibiotic items generated. Blue Dart Pharma Express tracking assigned: #BD-884102.',
    category: 'DELIVERIES',
    priority: 'MEDIUM',
    createdAt: new Date(Date.now() - 2800 * 60 * 1000).toISOString(),
    read: true,
    poNumber: 'PO-2025-0047',
    actionLink: '/supplier/deliveries',
    actionText: 'Track Consignment'
  }
];

export default function SupplierNotificationsPage() {
  const navigate = useNavigate();
  const [mainViewTab, setMainViewTab] = useState('alerts'); // alerts | preferences
  const [notifications, setNotifications] = useState(SEED_SUPPLIER_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

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

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch real notifications and merge with seed supplier notices
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data) && data.length > 0) {
        const mappedBackend = data.map((n, i) => ({
          id: n.notificationId || (2000 + i),
          title: n.title || 'System Notification',
          message: n.message || n.content || '',
          category: n.relatedEntityType === 'PURCHASE_ORDER' ? 'ORDERS' : n.notificationType === 'LOW_STOCK' ? 'STOCK' : 'COMPLIANCE',
          priority: n.priority || (n.read ? 'LOW' : 'HIGH'),
          createdAt: n.createdAt || new Date().toISOString(),
          read: Boolean(n.read),
          poNumber: n.relatedEntityType === 'PURCHASE_ORDER' ? 'PO-2025-0048' : null,
          actionLink: n.relatedEntityType === 'PURCHASE_ORDER' ? '/supplier/orders' : '/supplier/deliveries',
          actionText: n.relatedEntityType === 'PURCHASE_ORDER' ? 'Review Order' : 'View Portal'
        }));

        // Deduplicate
        const merged = [...mappedBackend];
        for (const s of SEED_SUPPLIER_NOTIFICATIONS) {
          if (!merged.some(m => m.id === s.id || m.title === s.title)) {
            merged.push(s);
          }
        }
        setNotifications(merged);
      } else {
        setNotifications(SEED_SUPPLIER_NOTIFICATIONS);
      }
    } catch (_err) {
      setNotifications(SEED_SUPPLIER_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for real-time WebSocket pushes
    const unsub = wsService.subscribeNotifications((evt) => {
      const notifData = evt?.data || evt;
      if (notifData && (notifData.title || notifData.message)) {
        setNotifications((prev) => [
          {
            id: notifData.notificationId || Date.now(),
            title: notifData.title || 'Live Supplier Alert',
            message: notifData.message || 'New vendor notification received',
            category: 'ORDERS',
            priority: 'HIGH',
            createdAt: new Date().toISOString(),
            read: false,
            actionLink: '/supplier/orders',
            actionText: 'Inspect Alert'
          },
          ...prev
        ]);
        showToast(`🔔 New notification: ${notifData.title || 'Live Alert'}`);
      }
    });

    return () => unsub();
  }, [loadData]);

  // Mark single as read
  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id).catch(() => null);
    } catch (_e) {}
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    showToast('Notification marked as read.');
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead().catch(() => null);
    } catch (_e) {}
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read.');
  };

  // Export CSV
  const handleExport = () => {
    exportToCsv('Supplier_Notifications_Log', notifications, [
      { key: 'title', label: 'Title' },
      { key: 'message', label: 'Message' },
      { key: 'category', label: 'Category' },
      { key: 'priority', label: 'Priority' },
      { key: 'createdAt', label: 'Timestamp' },
      { key: 'read', label: 'Read Status' }
    ]);
    showToast('Exported notifications to CSV.');
  };

  // Filtered notifications
  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.message && n.message.toLowerCase().includes(q)) ||
        (n.poNumber && n.poNumber.toLowerCase().includes(q));

      const matchCat =
        categoryFilter === 'ALL' || n.category === categoryFilter;

      const matchPri =
        priorityFilter === 'ALL' || n.priority === priorityFilter;

      const matchStat =
        statusFilter === 'ALL' ||
        (statusFilter === 'UNREAD' && !n.read) ||
        (statusFilter === 'READ' && n.read);

      return matchSearch && matchCat && matchPri && matchStat;
    });
  }, [notifications, search, categoryFilter, priorityFilter, statusFilter]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const ordersCount = notifications.filter((n) => n.category === 'ORDERS').length;
  const deliveryCount = notifications.filter((n) => n.category === 'DELIVERIES').length;
  const complianceCount = notifications.filter((n) => n.category === 'COMPLIANCE').length;

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'ORDERS': return 'clay-squircle--blue';
      case 'DELIVERIES': return 'clay-squircle--amber';
      case 'STOCK': return 'clay-squircle--coral';
      case 'COMPLIANCE': return 'clay-squircle--teal';
      default: return 'clay-squircle--mint';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'ORDERS': return <IconOrders size={18} />;
      case 'DELIVERIES': return <IconTruck size={18} />;
      case 'STOCK': return <IconPill size={18} />;
      case 'COMPLIANCE': return <IconShield size={18} />;
      default: return <IconBell size={18} />;
    }
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast popup */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            right: 28,
            zIndex: 9999,
            background: '#0F4A47',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
            fontSize: '0.86rem'
          }}
        >
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── Universal Supplier Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="clay-stat-card__icon-squircle clay-squircle--teal"
              style={{ width: 44, height: 44, minWidth: 44, borderRadius: 12 }}
            >
              <IconBell size={22} />
            </div>
            <div>
              <h1 className="admin-dash-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                Supplier Notifications Center
                {unreadCount > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 12
                    }}
                  >
                    {unreadCount} UNREAD
                  </span>
                )}
              </h1>
              <p className="admin-dash-sub">
                Real-time purchase order dispatch alerts, goods receiving acknowledgements, and cold chain notices.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime}
          </span>
          {unreadCount > 0 && (
            <button
              className="clay-action-pill-btn clay-action-pill-btn--primary"
              onClick={handleMarkAllRead}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <IconCheckCircle size={16} /> Mark All Read
            </button>
          )}
          <button
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            onClick={handleExport}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconDownload size={16} /> Export Log
          </button>
          <button
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            onClick={loadData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconRefresh size={16} />
          </button>
        </div>
      </div>

      {/* ── View Switcher: In-App Alerts vs. Email Preferences ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 22, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button
          onClick={() => setMainViewTab('alerts')}
          style={{
            padding: '10px 20px',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: mainViewTab === 'alerts' ? '#f59e0b' : '#f1f5f9',
            color: mainViewTab === 'alerts' ? '#ffffff' : '#64748b',
            boxShadow: mainViewTab === 'alerts' ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <IconBell size={16} /> In-App Alerts
        </button>

        <button
          onClick={() => setMainViewTab('preferences')}
          style={{
            padding: '10px 20px',
            borderRadius: 14,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: mainViewTab === 'preferences' ? '#f59e0b' : '#f1f5f9',
            color: mainViewTab === 'preferences' ? '#ffffff' : '#64748b',
            boxShadow: mainViewTab === 'preferences' ? '0 4px 14px rgba(245, 158, 11, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <IconMail size={16} /> Email Notification Preferences
        </button>
      </div>

      {mainViewTab === 'preferences' ? (
        <EmailPreferencesPanel />
      ) : (
        <>
      {/* ── 4 KPI Summary Cards ── */}
      <div className="clay-stat-grid-4">
        {/* KPI 1: Unread Alerts */}
        <div
          className="clay-stat-card"
          onClick={() => setStatusFilter(statusFilter === 'UNREAD' ? 'ALL' : 'UNREAD')}
          style={{ cursor: 'pointer', border: statusFilter === 'UNREAD' ? '2px solid #ef4444' : undefined }}
        >
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Unread Notifications</span>
            <div className="clay-stat-card__value" style={{ color: '#ef4444' }}>{unreadCount}</div>
            <span className="clay-stat-card__sub" style={{ color: '#ef4444', fontWeight: 600 }}>Requires attention &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconBell size={22} />
          </div>
        </div>

        {/* KPI 2: Order Alerts */}
        <div
          className="clay-stat-card"
          onClick={() => setCategoryFilter(categoryFilter === 'ORDERS' ? 'ALL' : 'ORDERS')}
          style={{ cursor: 'pointer', border: categoryFilter === 'ORDERS' ? '2px solid #0284c7' : undefined }}
        >
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">PO Action Items</span>
            <div className="clay-stat-card__value" style={{ color: '#0284c7' }}>{ordersCount}</div>
            <span className="clay-stat-card__sub" style={{ color: '#0284c7', fontWeight: 600 }}>Active requisitions &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconOrders size={22} />
          </div>
        </div>

        {/* KPI 3: Delivery Milestones */}
        <div
          className="clay-stat-card"
          onClick={() => setCategoryFilter(categoryFilter === 'DELIVERIES' ? 'ALL' : 'DELIVERIES')}
          style={{ cursor: 'pointer', border: categoryFilter === 'DELIVERIES' ? '2px solid #ea580c' : undefined }}
        >
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Dispatch Updates</span>
            <div className="clay-stat-card__value" style={{ color: '#ea580c' }}>{deliveryCount}</div>
            <span className="clay-stat-card__sub" style={{ color: '#ea580c', fontWeight: 600 }}>Transit & delivery &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconTruck size={22} />
          </div>
        </div>

        {/* KPI 4: Compliance & GDP */}
        <div
          className="clay-stat-card"
          onClick={() => setCategoryFilter(categoryFilter === 'COMPLIANCE' ? 'ALL' : 'COMPLIANCE')}
          style={{ cursor: 'pointer', border: categoryFilter === 'COMPLIANCE' ? '2px solid #008c8c' : undefined }}
        >
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Compliance Alerts</span>
            <div className="clay-stat-card__value" style={{ color: '#008c8c' }}>{complianceCount}</div>
            <span className="clay-stat-card__sub" style={{ color: '#008c8c', fontWeight: 600 }}>Quality & audit &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconShield size={22} />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#ffffff',
          padding: '14px 18px',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <IconSearch
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
          />
          <input
            type="text"
            placeholder="Search by title, PO number, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              border: '1px solid #cbd5e1',
              borderRadius: 20,
              fontSize: '0.85rem',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="clay-select-pill"
          style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        >
          <option value="ALL">All Categories</option>
          <option value="ORDERS">Purchase Orders</option>
          <option value="DELIVERIES">Dispatches & Deliveries</option>
          <option value="COMPLIANCE">Cold Chain & Compliance</option>
          <option value="STOCK">Stock Depletion</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="clay-select-pill"
          style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        >
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="clay-select-pill"
          style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid #cbd5e1', fontSize: '0.84rem' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="UNREAD">Unread Only</option>
          <option value="READ">Read Only</option>
        </select>

        {(search || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || statusFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('ALL');
              setPriorityFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* ── Main Two-Column Layout: Notification Feed (Left) + Detail & Sidebar (Right) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        {/* Left: Notifications Feed */}
        <div className="clay-card-table" style={{ padding: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #eef3f8'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconBell size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>
                Supplier Notifications ({filteredNotifs.length})
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                className="staff-btn staff-btn--sm"
                style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontWeight: 600, padding: '4px 10px', borderRadius: 16, cursor: 'pointer' }}
                onClick={handleMarkAllRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                Loading supplier notifications...
              </div>
            ) : filteredNotifs.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <IconCheckCircle size={36} color="#10b981" style={{ marginBottom: 10 }} />
                <h4 style={{ margin: 0, color: '#1e293b' }}>No notifications found</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem' }}>You're all caught up with your orders and shipments.</p>
              </div>
            ) : (
              filteredNotifs.map((n) => {
                const isSelected = selectedNotif?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setSelectedNotif(n);
                      if (!n.read) handleMarkRead(n.id);
                    }}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                      background: isSelected ? '#f0fdfa' : !n.read ? 'linear-gradient(90deg, rgba(0, 140, 140, 0.04) 0%, transparent 60%)' : '#ffffff',
                      borderLeft: isSelected ? '4px solid #008C8C' : !n.read ? '4px solid #0284c7' : '4px solid transparent',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div
                      className={`clay-stat-card__icon-squircle ${getCategoryBadgeClass(n.category)}`}
                      style={{ width: 40, height: 40, minWidth: 40, borderRadius: 12, marginTop: 2 }}
                    >
                      {getCategoryIcon(n.category)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: n.read ? 600 : 800, fontSize: '0.94rem', color: '#16324F' }}>
                            {n.title}
                          </span>
                          {!n.read && (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: '#0284c7',
                                display: 'inline-block'
                              }}
                            />
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </div>

                      <p style={{ margin: '6px 0 10px 0', fontSize: '0.84rem', color: '#475569', lineHeight: 1.5 }}>
                        {n.message}
                      </p>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            background: '#f1f5f9',
                            color: '#334155'
                          }}
                        >
                          {n.category}
                        </span>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontWeight: 700,
                            background: n.priority === 'HIGH' ? '#fee2e2' : n.priority === 'MEDIUM' ? '#fef3c7' : '#ecfdf5',
                            color: n.priority === 'HIGH' ? '#dc2626' : n.priority === 'MEDIUM' ? '#d97706' : '#059669'
                          }}
                        >
                          {n.priority} PRIORITY
                        </span>

                        {n.poNumber && (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#008C8C',
                              background: '#e6f6f6',
                              padding: '2px 6px',
                              borderRadius: 4
                            }}
                          >
                            {n.poNumber}
                          </span>
                        )}

                        {n.actionLink && (
                          <button
                            type="button"
                            className="staff-btn staff-btn--sm"
                            style={{
                              marginLeft: 'auto',
                              background: '#008C8C',
                              color: '#ffffff',
                              border: 'none',
                              padding: '4px 10px',
                              borderRadius: 14,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(n.actionLink);
                            }}
                          >
                            {n.actionText || 'Take Action'} &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Notification Sidebar Inspector & Quick Tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Inspector Card */}
          <div className="clay-side-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconEye size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#16324F' }}>
                Notification Inspector
              </h3>
            </div>

            {selectedNotif ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Title</span>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#16324F', marginTop: 2 }}>{selectedNotif.title}</div>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>Description</span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: '#334155', lineHeight: 1.5 }}>{selectedNotif.message}</p>
                </div>

                <div className="staff-ops-list" style={{ marginTop: 4 }}>
                  <div className="staff-ops-item">
                    <span style={{ color: '#64748B' }}>Category</span>
                    <span style={{ fontWeight: 700, color: '#16324F' }}>{selectedNotif.category}</span>
                  </div>
                  <div className="staff-ops-item">
                    <span style={{ color: '#64748B' }}>Priority</span>
                    <span style={{ fontWeight: 700, color: selectedNotif.priority === 'HIGH' ? '#dc2626' : '#008C8C' }}>{selectedNotif.priority}</span>
                  </div>
                  <div className="staff-ops-item">
                    <span style={{ color: '#64748B' }}>Read Status</span>
                    <span style={{ fontWeight: 600, color: selectedNotif.read ? '#059669' : '#dc2626' }}>
                      {selectedNotif.read ? 'Read' : 'Unread'}
                    </span>
                  </div>
                  {selectedNotif.poNumber && (
                    <div className="staff-ops-item">
                      <span style={{ color: '#64748B' }}>Associated PO</span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#008C8C' }}>{selectedNotif.poNumber}</span>
                    </div>
                  )}
                </div>

                {selectedNotif.actionLink && (
                  <button
                    type="button"
                    className="clay-action-pill-btn clay-action-pill-btn--primary"
                    style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                    onClick={() => navigate(selectedNotif.actionLink)}
                  >
                    {selectedNotif.actionText || 'Proceed to Details'} &rarr;
                  </button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: '#94a3b8' }}>
                <IconBell size={28} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: '0.84rem' }}>Select a notification from the list to inspect full details and related actions.</p>
              </div>
            )}
          </div>

          {/* Supplier Wholesale AI Assistant Card */}
          <div className="clay-side-widget" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%)', borderColor: '#bfdbfe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <IconSparkles size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#1e3a8a' }}>
                Supplier AI Inquiries
              </h3>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#1d4ed8', lineHeight: 1.4 }}>
              Need clarification on pending orders or delivery SLA? Ask the MediStock AI Assistant directly.
            </p>
            <button
              type="button"
              className="staff-btn"
              style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: 18, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', width: '100%' }}
              onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'Summarize my current order and delivery notifications' } }))}
            >
              <IconSparkles size={16} />
              <span>Ask AI About Notifications</span>
            </button>
          </div>

          {/* SLA Notice */}
          <div className="clay-side-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--amber" style={{ width: 32, height: 32, minWidth: 32 }}>
                <IconClock size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#16324F' }}>
                Fulfillment Protocol SLA
              </h3>
            </div>
            <p style={{ margin: '0', fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Standard fulfillment SLA requires vendor order acknowledgment within 12 hours and carrier dispatch booking within 48 hours.
            </p>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}

