import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/api';
import {
  IconBell,
  IconCheckCircle,
  IconAlertTriangle,
  IconSearch,
  IconClock,
  IconPackage,
  IconDownload,
  IconCheck,
  IconMail,
  IconShield
} from '../../components/icons/Icons';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToCsv } from '../../utils/csvExport';
import AdminEmailMonitoringTab from './AdminEmailMonitoringTab';
import EmailPreferencesPanel from '../../components/notifications/EmailPreferencesPanel';
import './AdminPages.css';

// Seed Notifications strictly matching medical theme
const SEED_NOTIFICATIONS = [
  { id: 1, title: 'Low Stock Alert', message: 'Paracetamol 500mg is running low (5 units left).', category: 'Stock', priority: 'High', date: 'Today, 09:15 AM', status: 'Unread', iconSymbol: '⚠️', squircleBg: 'clay-squircle--coral' },
  { id: 2, title: 'Expiry Reminder', message: 'Amoxicillin 500mg expires in 3 days (Dec 15, 2026).', category: 'Expiry', priority: 'High', date: 'Today, 08:42 AM', status: 'Unread', iconSymbol: '🕒', squircleBg: 'clay-squircle--amber' },
  { id: 3, title: 'Purchase Order Update', message: 'PO-2026-081 has been submitted by Pharmacist Sarah Lin.', category: 'Purchase Orders', priority: 'Medium', date: 'Today, 08:20 AM', status: 'Unread', iconSymbol: '📋', squircleBg: 'clay-squircle--blue' },
  { id: 4, title: 'System Notification', message: 'Daily automated stock audit report is ready for download.', category: 'System', priority: 'Low', date: 'Yesterday, 06:45 PM', status: 'Read', iconSymbol: '🛡️', squircleBg: 'clay-squircle--mint' },
  { id: 5, title: 'Expiry Reminder', message: 'Metformin 850mg expires in 5 days (Dec 18, 2026).', category: 'Expiry', priority: 'Medium', date: 'Yesterday, 04:10 PM', status: 'Read', iconSymbol: '🕒', squircleBg: 'clay-squircle--amber' },
  { id: 6, title: 'Purchase Order Received', message: 'PO-2026-079 goods receipt verified by Inventory Staff.', category: 'Purchase Orders', priority: 'Medium', date: 'Yesterday, 02:30 PM', status: 'Read', iconSymbol: '📦', squircleBg: 'clay-squircle--teal' },
];

export default function AdminNotificationsPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'email' || location.pathname.includes('email') ? 'smtp' : 'in-app';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [toast, setToast] = useState(null);

  // Filter Bar state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const loadBackendNotifs = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((n, i) => ({
          id: n.notificationId || i + 1,
          title: n.title || 'System Notification',
          message: n.message || n.content || '',
          category: n.category || 'System',
          priority: n.priority || 'Medium',
          date: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          status: n.read ? 'Read' : 'Unread',
          iconSymbol: n.category === 'Stock' ? '⚠️' : n.category === 'Expiry' ? '🕒' : '🔔',
          squircleBg: n.category === 'Stock' ? 'clay-squircle--coral' : n.category === 'Expiry' ? 'clay-squircle--amber' : 'clay-squircle--teal'
        }));
        setNotifications(mapped);
      }
    } catch (_err) {}
  }, []);

  useEffect(() => {
    loadBackendNotifs();
  }, [loadBackendNotifs]);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead().catch(() => null);
    } catch (_e) {}
    setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' })));
    showToast('All notifications marked as read.');
  };

  const handleToggleRead = async (id) => {
    const target = notifications.find(n => n.id === id);
    if (target && target.status === 'Unread') {
      await markNotificationRead(id).catch(() => null);
    }
    setNotifications(prev => prev.map(n => {
      if (n.id === id) {
        const nextStatus = n.status === 'Read' ? 'Unread' : 'Read';
        return { ...n, status: nextStatus };
      }
      return n;
    }));
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const matchSearch = !search ||
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.message.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || n.category === categoryFilter;
      const matchPri = !priorityFilter || n.priority === priorityFilter;
      const matchStat = !statusFilter || n.status === statusFilter;
      return matchSearch && matchCat && matchPri && matchStat;
    });
  }, [notifications, search, categoryFilter, priorityFilter, statusFilter]);

  const totalNotifs = notifications.length;
  const unreadNotifs = notifications.filter(n => n.status === 'Unread').length;
  const lowStockNotifs = notifications.filter(n => n.category === 'Stock' || n.title.toLowerCase().includes('stock')).length;
  const expiryNotifs = notifications.filter(n => n.category === 'Expiry' || n.title.toLowerCase().includes('expir')).length;

  const donutData = [
    { name: 'Unread', value: unreadNotifs || 3, color: '#f87171' },
    { name: 'Stock', value: lowStockNotifs || 2, color: '#f59e0b' },
    { name: 'Read', value: Math.max(1, totalNotifs - unreadNotifs), color: '#14b8a6' }
  ];

  function handleExport() {
    exportToCsv('medistock_notifications_log', notifications, [
      { key: 'title', label: 'Title' },
      { key: 'message', label: 'Message' },
      { key: 'category', label: 'Category' },
      { key: 'priority', label: 'Priority' },
      { key: 'date', label: 'Date/Time' },
      { key: 'status', label: 'Status' }
    ]);
    showToast('Exported notifications log to CSV.');
  }

  return (
    <div className="admin-page-container">
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>Notifications</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Stay updated with real-time inventory alerts, order actions, and system messages.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={handleMarkAllRead}
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
            <IconCheckCircle size={16} /> Mark All as Read
          </button>

          <button
            onClick={handleExport}
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
            <IconDownload size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Notification Hub Tabs ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab('in-app')}
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
            background: activeTab === 'in-app' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'in-app' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'in-app' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <IconBell size={16} /> In-App Alerts
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
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
            background: activeTab === 'smtp' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'smtp' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'smtp' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <IconMail size={16} /> SMTP Outbox & Email Logs
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
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
            background: activeTab === 'preferences' ? '#0284c7' : '#f1f5f9',
            color: activeTab === 'preferences' ? '#ffffff' : '#64748b',
            boxShadow: activeTab === 'preferences' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <IconShield size={16} /> Email Preferences
        </button>
      </div>

      {toast && (
        <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(6, 95, 70, 0.08)' }}>
          <span style={{ fontWeight: 600 }}>✓ {toast}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {activeTab === 'smtp' && (
        <AdminEmailMonitoringTab onToast={showToast} />
      )}

      {activeTab === 'preferences' && (
        <EmailPreferencesPanel onToast={showToast} />
      )}

      {activeTab === 'in-app' && (
        <>
          {/* ── 4 Stat Cards ── */}
          <div className="clay-stat-grid-4">
        {/* Total Notifications */}
        <div className="clay-stat-card">
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Notifications</span>
            <span className="clay-stat-card__value">{totalNotifs}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>Live system logs</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconBell size={24} />
          </div>
        </div>

        {/* Unread Alerts */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setStatusFilter('Unread')}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Unread Alerts</span>
            <span className="clay-stat-card__value" style={{ color: '#dc2626' }}>{unreadNotifs}</span>
            <span className="clay-stat-card__sub" style={{ color: '#dc2626' }}>Requires attention</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <span style={{ fontSize: 24 }}>🚨</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setCategoryFilter('Stock')}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Low Stock Alerts</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>{lowStockNotifs}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Reorder thresholds</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconPackage size={24} />
          </div>
        </div>

        {/* Expiry Reminders */}
        <div className="clay-stat-card" style={{ cursor: 'pointer' }} onClick={() => setCategoryFilter('Expiry')}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiry Reminders</span>
            <span className="clay-stat-card__value" style={{ color: '#7e22ce' }}>{expiryNotifs}</span>
            <span className="clay-stat-card__sub" style={{ color: '#7e22ce' }}>Critical quarantine</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconClock size={24} />
          </div>
        </div>
      </div>

      {/* ── Inset Filter Bar ── */}
      <div className="clay-filter-bar">
        <div className="clay-search-pill" style={{ position: 'relative', flex: '1 1 280px', display: 'flex', alignItems: 'center' }}>
          <IconSearch size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 2 }} />
          <input
            type="text"
            placeholder="Search alerts, medicines, purchase orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', height: 42, padding: '0 18px 0 48px', boxSizing: 'border-box' }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">All Categories</option>
          <option value="Stock">Stock Alerts</option>
          <option value="Expiry">Expiry Reminders</option>
          <option value="Purchase Orders">Purchase Orders</option>
          <option value="System">System Logs</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="clay-select-pill"
        >
          <option value="">All Status</option>
          <option value="Unread">Unread Only</option>
          <option value="Read">Read Only</option>
        </select>

        {(search || categoryFilter || priorityFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setCategoryFilter(''); setPriorityFilter(''); setStatusFilter(''); }}
            style={{
              padding: '0 16px',
              height: 42,
              borderRadius: 20,
              border: '1px solid #dce8f2',
              background: '#ffffff',
              color: '#64748b',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* ── Split Layout ── */}
      <div className="clay-split-grid">
        {/* Left Column: Notifications Feed */}
        <div className="clay-card-table">
          <div className="clay-card-table__header">
            <h3 className="clay-card-table__title">Notification Feed</h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{filteredNotifications.length} items</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleToggleRead(notif.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 22px',
                  borderBottom: '1px solid #f1f5f9',
                  background: notif.status === 'Unread' ? '#f0fdfa' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className={`clay-stat-card__icon-squircle ${notif.squircleBg}`} style={{ width: 42, height: 42, borderRadius: 12, fontSize: 18 }}>
                    {notif.iconSymbol}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, color: '#16324F', fontSize: '0.9rem' }}>{notif.title}</span>
                      {notif.status === 'Unread' && (
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#008C8C' }} />
                      )}
                    </div>
                    <p style={{ margin: '3px 0 0 0', color: '#64748B', fontSize: '0.8125rem' }}>{notif.message}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.74rem', fontWeight: 600 }}>{notif.date}</span>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: 10,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: notif.priority === 'High' ? '#fee2e2' : notif.priority === 'Medium' ? '#fef3c7' : '#f1f5f9',
                      color: notif.priority === 'High' ? '#dc2626' : notif.priority === 'Medium' ? '#b45309' : '#475569'
                    }}
                  >
                    {notif.priority}
                  </span>
                </div>
              </div>
            ))}
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

        {/* Right Column: Breakdown & Quick Actions */}
        <div className="clay-side-widget">
          <h3 className="clay-side-widget__title">Alert Distribution</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', width: 110, height: 110 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324F' }}>{unreadNotifs}</span>
                <span style={{ fontSize: '0.64rem', color: '#64748B' }}>Unread</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, fontSize: '0.74rem' }}>
              {donutData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: '#334155', fontWeight: 600 }}>{item.name}</span>
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <button
              onClick={handleMarkAllRead}
              className="clay-btn-pastel"
              style={{
                width: '100%',
                height: 38,
                borderRadius: 16,
                border: '1px solid #dce8f2',
                background: '#ffffff',
                color: '#008C8C',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                marginBottom: 8
              }}
            >
              Mark All as Read
            </button>
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); setPriorityFilter(''); setStatusFilter(''); }}
              style={{
                width: '100%',
                height: 38,
                borderRadius: 16,
                border: 'none',
                background: '#edf3f9',
                color: '#475569',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
