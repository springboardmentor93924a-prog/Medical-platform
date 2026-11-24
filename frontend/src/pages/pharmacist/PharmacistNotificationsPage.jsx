import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../../services/api';
import {
  IconBell,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconOrders,
  IconSearch,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconMoreVertical,
  IconCheck,
  IconX,
  IconEye,
  IconTrash,
  IconFilter,
  IconBox,
  IconDownload,
  IconMail
} from '../../components/icons/Icons';
import EmailPreferencesPanel from '../../components/notifications/EmailPreferencesPanel';
import './PharmacistNotificationsPage.css';
import '../admin/AdminPages.css';

// Default mock notifications to match screenshot exactly
const DEFAULT_NOTIFICATIONS = [
  {
    notificationId: 1,
    title: 'Low Stock Alert',
    message: 'Paracetamol 500mg (Batch B-1024) is now below minimum stock level (10 units).',
    type: 'LOW_STOCK',
    category: 'Low Stock',
    createdAt: 'Apr 24, 2025 • 09:45 AM',
    read: false,
    relatedRoute: '/pharmacist/stock',
    iconColor: '#EF4444'
  },
  {
    notificationId: 2,
    title: 'Expiry Alert',
    message: 'Amoxicillin 500mg (Batch B-0876) expires in 3 days (Apr 27, 2025).',
    type: 'EXPIRY',
    category: 'Expiry',
    createdAt: 'Apr 24, 2025 • 08:30 AM',
    read: false,
    relatedRoute: '/pharmacist/expiry',
    iconColor: '#8B5CF6'
  },
  {
    notificationId: 3,
    title: 'Purchase Order Update',
    message: 'PO-2025-0017 has been approved by the manager.',
    type: 'PURCHASE',
    category: 'Purchase',
    createdAt: 'Apr 24, 2025 • 07:20 AM',
    read: false,
    relatedRoute: '/pharmacist/purchases',
    iconColor: '#008C8C'
  },
  {
    notificationId: 4,
    title: 'Low Stock Alert',
    message: 'Metformin 500mg (Batch B-0765) is now below minimum stock level (20 units).',
    type: 'LOW_STOCK',
    category: 'Low Stock',
    createdAt: 'Apr 23, 2025 • 05:15 PM',
    read: false,
    relatedRoute: '/pharmacist/stock',
    iconColor: '#EF4444'
  },
  {
    notificationId: 5,
    title: 'Expiry Alert',
    message: 'Omeprazole 20mg (Batch B-0654) expires in 7 days (May 01, 2025).',
    type: 'EXPIRY',
    category: 'Expiry',
    createdAt: 'Apr 23, 2025 • 02:40 PM',
    read: false,
    relatedRoute: '/pharmacist/expiry',
    iconColor: '#8B5CF6'
  },
  {
    notificationId: 6,
    title: 'Purchase Order Update',
    message: 'PO-2025-0016 has been partially received (60% of items).',
    type: 'PURCHASE',
    category: 'Purchase',
    createdAt: 'Apr 22, 2025 • 11:10 AM',
    read: true,
    relatedRoute: '/pharmacist/purchases',
    iconColor: '#3B82F6'
  },
  {
    notificationId: 7,
    title: 'Low Stock Alert',
    message: 'Ibuprofen 400mg (Batch B-0532) is now below minimum stock level (15 units).',
    type: 'LOW_STOCK',
    category: 'Low Stock',
    createdAt: 'Apr 22, 2025 • 09:05 AM',
    read: true,
    relatedRoute: '/pharmacist/stock',
    iconColor: '#EF4444'
  },
  {
    notificationId: 8,
    title: 'Expiry Alert',
    message: 'Atorvastatin 10mg (Batch B-0210) expires in 10 days (May 04, 2025).',
    type: 'EXPIRY',
    category: 'Expiry',
    createdAt: 'Apr 21, 2025 • 04:30 PM',
    read: true,
    relatedRoute: '/pharmacist/expiry',
    iconColor: '#8B5CF6'
  },
  {
    notificationId: 9,
    title: 'Purchase Order Update',
    message: 'PO-2025-0015 has been received completely.',
    type: 'PURCHASE',
    category: 'Purchase',
    createdAt: 'Apr 21, 2025 • 01:15 PM',
    read: true,
    relatedRoute: '/pharmacist/purchases',
    iconColor: '#3B82F6'
  },
  {
    notificationId: 10,
    title: 'System Notification',
    message: 'Inventory report for March 2025 is now available.',
    type: 'INFO',
    category: 'Info',
    createdAt: 'Apr 20, 2025 • 10:00 AM',
    read: true,
    relatedRoute: '/pharmacist/reports',
    iconColor: '#10B981'
  },
  {
    notificationId: 11,
    title: 'Low Stock Alert',
    message: 'Ciprofloxacin 500mg is below threshold (12 units).',
    type: 'LOW_STOCK',
    category: 'Low Stock',
    createdAt: 'Apr 19, 2025 • 04:15 PM',
    read: true,
    relatedRoute: '/pharmacist/stock',
    iconColor: '#EF4444'
  },
  {
    notificationId: 12,
    title: 'Expiry Alert',
    message: 'Losartan 50mg (Batch B-1030) expires in 28 days.',
    type: 'EXPIRY',
    category: 'Expiry',
    createdAt: 'Apr 18, 2025 • 11:20 AM',
    read: true,
    relatedRoute: '/pharmacist/expiry',
    iconColor: '#8B5CF6'
  }
];

export default function PharmacistNotificationsPage() {
  const navigate = useNavigate();
  const [mainViewTab, setMainViewTab] = useState('alerts'); // alerts | preferences
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | LOW_STOCK | EXPIRY | PURCHASE
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | UNREAD | READ
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load Notifications
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications().catch(() => []);
      const list = Array.isArray(data) ? data : (data?.data || []);

      if (list.length > 0) {
        const mapped = list.map((n, i) => {
          const type = (n.type || '').toUpperCase();
          let cat = 'System';
          let iconColor = '#008C8C';
          let route = '/pharmacist';

          if (type.includes('STOCK')) {
            cat = 'Low Stock';
            iconColor = '#F59E0B';
            route = '/pharmacist/medicines';
          } else if (type.includes('EXPIR')) {
            cat = 'Expiry';
            iconColor = '#06B6D4';
            route = '/pharmacist/expiry';
          } else if (type.includes('ORDER')) {
            cat = 'Purchase';
            iconColor = '#10B981';
            route = '/pharmacist/purchases';
          }

          return {
            notificationId: n.notificationId || i + 1,
            title: n.title || 'System Notification',
            message: n.message || '',
            type: cat.toUpperCase().replace(' ', '_'),
            category: cat,
            createdAt: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent',
            read: !!n.read,
            relatedRoute: route,
            iconColor
          };
        });
        setNotifications(mapped);
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications(DEFAULT_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.notif-menu-wrap')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((n) => !n.read).length;
    const lowStock = notifications.filter((n) => n.category === 'Low Stock').length;
    const expiry = notifications.filter((n) => n.category === 'Expiry').length;
    const purchase = notifications.filter((n) => n.category === 'Purchase').length;
    return { total, unread, lowStock, expiry, purchase };
  }, [notifications]);

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab category filter
      let matchTab = true;
      if (activeTab === 'LOW_STOCK') matchTab = n.category === 'Low Stock';
      else if (activeTab === 'EXPIRY') matchTab = n.category === 'Expiry';
      else if (activeTab === 'PURCHASE') matchTab = n.category === 'Purchase';

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'UNREAD') matchStatus = !n.read;
      else if (statusFilter === 'READ') matchStatus = n.read;

      // Search filter
      const matchSearch =
        !searchTerm ||
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase());

      return matchTab && matchStatus && matchSearch;
    });
  }, [notifications, activeTab, statusFilter, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [filteredNotifications, currentPage]);

  // Mark single as read/unread
  const handleToggleRead = async (notif) => {
    const newRead = !notif.read;
    if (newRead) {
      await markNotificationRead(notif.notificationId).catch(() => null);
    }
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notif.notificationId ? { ...n, read: newRead } : n
      )
    );
    showToast('info', `Notification marked as ${newRead ? 'read' : 'unread'}.`);
    setActiveMenuId(null);
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    await markAllNotificationsRead().catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('success', 'All notifications marked as read.');
  };

  // Delete notification
  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((n) => n.notificationId !== id));
    showToast('info', 'Notification removed.');
    setActiveMenuId(null);
  };

  // Clear all read
  const handleClearRead = () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    showToast('success', 'Cleared all read notifications.');
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Alert */}
      {toast && (
        <div className={`notif-toast notif-toast--${toast.type} fade-in`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Header (Admin Clay Layout) ── */}
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <div className="admin-page-header__left">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#102e59', margin: '0 0 4px 0', letterSpacing: '-0.4px' }}>
            Notifications
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
            Real-time critical inventory alerts, purchase updates, expiry thresholds and delivery notifications.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <button
            className="admin-btn admin-btn--primary"
            style={{ borderRadius: 9999, padding: '10px 22px' }}
            onClick={handleMarkAllRead}
          >
            <IconCheck size={16} /> Mark All as Read
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 18px', background: '#ffffff' }}
            onClick={handleClearRead}
          >
            <IconTrash size={16} /> Clear Read
          </button>
          <button
            className="admin-btn admin-btn--outline"
            style={{ borderRadius: 9999, padding: '10px 16px', background: '#ffffff' }}
            onClick={loadData}
            title="Refresh Live Data"
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
            background: mainViewTab === 'alerts' ? '#0d9488' : '#f1f5f9',
            color: mainViewTab === 'alerts' ? '#ffffff' : '#64748b',
            boxShadow: mainViewTab === 'alerts' ? '0 4px 14px rgba(13, 148, 136, 0.35)' : 'none',
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
            background: mainViewTab === 'preferences' ? '#0d9488' : '#f1f5f9',
            color: mainViewTab === 'preferences' ? '#ffffff' : '#64748b',
            boxShadow: mainViewTab === 'preferences' ? '0 4px 14px rgba(13, 148, 136, 0.35)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <IconMail size={16} /> Email Notification Preferences
        </button>
      </div>

      {mainViewTab === 'preferences' ? (
        <EmailPreferencesPanel onToast={(msg, type) => showToast(type, msg)} />
      ) : (
        <>
      {/* ── 4 KPI Summary Cards (Clay Elevated 3D Tiles) ── */}
      <div className="clay-stat-grid-4" style={{ marginBottom: 22 }}>
        {/* Card 1: Total Notifications */}
        <div className="clay-stat-card" onClick={() => setActiveTab('ALL')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">TOTAL ALERTS</span>
            <span className="clay-stat-card__value">{stats.total || 12}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>↑ 33% vs. last week</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconBell size={22} />
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div className="clay-stat-card" onClick={() => setActiveTab('LOW_STOCK')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">LOW STOCK ALERTS</span>
            <span className="clay-stat-card__value" style={{ color: '#b45309' }}>{stats.lowStock || 5}</span>
            <span className="clay-stat-card__sub" style={{ color: '#d97706' }}>Requires Reorder</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={22} />
          </div>
        </div>

        {/* Card 3: Expiry Alerts */}
        <div className="clay-stat-card" onClick={() => setActiveTab('EXPIRY')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">EXPIRY ALERTS</span>
            <span className="clay-stat-card__value" style={{ color: '#0284c7' }}>{stats.expiry || 4}</span>
            <span className="clay-stat-card__sub" style={{ color: '#0284c7' }}>Near Expiry Batch</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconClock size={22} />
          </div>
        </div>

        {/* Card 4: Purchase Alerts */}
        <div className="clay-stat-card" onClick={() => setActiveTab('PURCHASE')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">PURCHASE ALERTS</span>
            <span className="clay-stat-card__value" style={{ color: '#008C8C' }}>{stats.purchase || 3}</span>
            <span className="clay-stat-card__sub" style={{ color: '#008C8C' }}>PO Approval / Delivery</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconOrders size={22} />
          </div>
        </div>
      </div>

      {/* ── Filter / Tab Navigation Bar matching Screenshot ── */}
      <div className="notif-filter-bar">
        <div className="notif-tabs">
          <button
            className={`notif-tab ${activeTab === 'ALL' ? 'notif-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('ALL');
              setCurrentPage(1);
            }}
          >
            All (12)
          </button>
          <button
            className={`notif-tab ${activeTab === 'LOW_STOCK' ? 'notif-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('LOW_STOCK');
              setCurrentPage(1);
            }}
          >
            Low Stock (5)
          </button>
          <button
            className={`notif-tab ${activeTab === 'EXPIRY' ? 'notif-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('EXPIRY');
              setCurrentPage(1);
            }}
          >
            Expiry (4)
          </button>
          <button
            className={`notif-tab ${activeTab === 'PURCHASE' ? 'notif-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('PURCHASE');
              setCurrentPage(1);
            }}
          >
            Purchase (3)
          </button>
        </div>

        <button className="notif-btn-mark-all" onClick={handleMarkAllRead}>
          <IconCheck size={16} />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* ── Two-Column Layout ── */}
      <div className="clay-split-grid">
        {/* Main List */}
        <div className="clay-card-table">
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                Loading notifications...
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
                <IconBell size={40} style={{ opacity: 0.3, margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontWeight: 600, color: '#16324F', margin: '0 0 4px 0' }}>
                  No notifications match your filters
                </p>
                <span style={{ fontSize: '0.8125rem' }}>All clinical alerts and orders are current.</span>
              </div>
            ) : (
              <div className="notif-items-list">
                {paginatedNotifications.map((notif) => {
                  return (
                    <div
                      key={notif.notificationId}
                      className={`notif-item ${!notif.read ? 'notif-item--unread' : ''}`}
                    >
                      {/* Left Icon Pill */}
                      <div
                        className="notif-item-icon-pill"
                        style={{ backgroundColor: `${notif.iconColor}15`, color: notif.iconColor }}
                      >
                        {notif.category === 'Low Stock' ? (
                          <IconAlertTriangle size={18} />
                        ) : notif.category === 'Expiry' ? (
                          <IconClock size={18} />
                        ) : notif.category === 'Purchase' ? (
                          <IconBox size={18} />
                        ) : (
                          <IconBell size={18} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="notif-item-content">
                        <div className="notif-item-top">
                          <h4 className="notif-item-title">{notif.title}</h4>
                          <span className="notif-item-time">{notif.createdAt}</span>
                        </div>
                        <p className="notif-item-msg">{notif.message}</p>
                        <div className="notif-item-meta">
                          <span
                            className="notif-category-badge"
                            style={{
                              backgroundColor: `${notif.iconColor}18`,
                              color: notif.iconColor
                            }}
                          >
                            {notif.category}
                          </span>
                          {!notif.read && <span className="notif-unread-dot" title="Unread alert" />}
                        </div>
                      </div>

                      {/* Right Action Menu */}
                      <div className="notif-item-actions">
                        <div className="notif-menu-wrap">
                          <button
                            className="notif-action-btn"
                            onClick={() =>
                              setActiveMenuId(
                                activeMenuId === notif.notificationId ? null : notif.notificationId
                              )
                            }
                          >
                            <IconMoreVertical size={16} />
                          </button>

                          {activeMenuId === notif.notificationId && (
                            <div className="notif-menu-dropdown fade-in">
                              <button onClick={() => handleToggleRead(notif)}>
                                {notif.read ? 'Mark as Unread' : 'Mark as Read'}
                              </button>
                              {notif.relatedRoute && (
                                <button
                                  onClick={() => {
                                    navigate(notif.relatedRoute);
                                    setActiveMenuId(null);
                                  }}
                                >
                                  View Related Page
                                </button>
                              )}
                              <button
                                className="menu-danger"
                                onClick={() => handleDelete(notif.notificationId)}
                              >
                                Delete Alert
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #eef3f8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: 500 }}>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredNotifications.length)} of {filteredNotifications.length} notifications
              </span>

              <div className="clay-pagination">
                <button
                  className="clay-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft size={16} />
                </button>
                <button
                  className={`clay-page-btn ${currentPage === 1 ? 'clay-page-btn--active' : ''}`}
                  onClick={() => setCurrentPage(1)}
                >
                  1
                </button>
                {totalPages > 1 && (
                  <button
                    className={`clay-page-btn ${currentPage === 2 ? 'clay-page-btn--active' : ''}`}
                    onClick={() => setCurrentPage(2)}
                  >
                    2
                  </button>
                )}
                <button
                  className="clay-page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        {/* ── Right Column: Sidebar Panels matching Screenshot ── */}
        <aside className="notif-right-col">
          {/* Card 1: Filter Notifications */}
          <div className="notif-sidebar-card">
            <h3 className="notif-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconFilter size={16} color="#008C8C" />
              Filter Notifications
            </h3>
            <div className="notif-sidebar-body">
              <div className="notif-field-group">
                <label className="notif-field-label">Notification Type</label>
                <select
                  className="notif-sidebar-select"
                  value={activeTab}
                  onChange={(e) => {
                    setActiveTab(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="EXPIRY">Expiry</option>
                  <option value="PURCHASE">Purchase</option>
                </select>
              </div>

              <div className="notif-field-group">
                <label className="notif-field-label">Date Range</label>
                <div className="notif-date-wrap">
                  <input
                    type="text"
                    className="notif-date-input"
                    value="Apr 17, 2025 – Apr 24, 2025"
                    readOnly
                  />
                  <IconClock size={16} className="notif-date-icon" />
                </div>
              </div>

              <div className="notif-field-group">
                <label className="notif-field-label">Status</label>
                <select
                  className="notif-sidebar-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="UNREAD">Unread</option>
                  <option value="READ">Read</option>
                </select>
              </div>

              <div className="notif-btn-row">
                <button
                  className="notif-btn notif-btn--primary"
                  onClick={() => showToast('info', 'Filters applied to notifications.')}
                >
                  Apply Filters
                </button>
                <button
                  className="notif-btn notif-btn--outline"
                  onClick={() => {
                    setActiveTab('ALL');
                    setStatusFilter('ALL');
                    setSearchTerm('');
                    showToast('info', 'Filters reset.');
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="notif-sidebar-card">
            <h3 className="notif-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconBox size={16} color="#008C8C" />
              Quick Actions
            </h3>
            <div className="notif-quick-actions-list">
              <button className="notif-quick-btn" onClick={() => navigate('/pharmacist/stock')}>
                <IconBox size={16} />
                <span>View Low Stock Items</span>
              </button>
              <button className="notif-quick-btn" onClick={() => navigate('/pharmacist/expiry')}>
                <IconClock size={16} />
                <span>View Expiry Items</span>
              </button>
              <button className="notif-quick-btn" onClick={() => navigate('/pharmacist/purchases')}>
                <IconOrders size={16} />
                <span>View Pending Purchase Orders</span>
              </button>
              <button
                className="notif-quick-btn"
                onClick={() => {
                  const csv =
                    'Title,Message,Date\n' +
                    notifications.map((n) => `"${n.title}","${n.message}","${n.createdAt}"`).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'medistock-notifications.csv';
                  a.click();
                  showToast('success', 'Notifications exported as CSV');
                }}
              >
                <IconDownload size={16} />
                <span>Export Notifications</span>
              </button>
            </div>
          </div>

          {/* Card 3: Recently Viewed */}
          <div className="notif-sidebar-card">
            <h3 className="notif-sidebar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconClock size={16} color="#008C8C" />
              Recently Viewed
            </h3>
            <div className="notif-recent-list">
              <div className="notif-recent-item" onClick={() => navigate('/pharmacist/stock')}>
                <div className="notif-recent-icon" style={{ backgroundColor: '#FEE2E2', color: '#EF4444' }}>
                  <IconAlertTriangle size={15} />
                </div>
                <div className="notif-recent-info">
                  <span className="notif-recent-name">Paracetamol 500mg</span>
                  <span className="notif-recent-sub">Low stock alert • 10 units remaining</span>
                  <span className="notif-recent-time">Apr 24, 2025 • 09:45 AM</span>
                </div>
                <IconChevronRight size={16} className="notif-recent-arrow" />
              </div>

              <div className="notif-recent-item" onClick={() => navigate('/pharmacist/expiry')}>
                <div className="notif-recent-icon" style={{ backgroundColor: '#EDE9FE', color: '#8B5CF6' }}>
                  <IconClock size={15} />
                </div>
                <div className="notif-recent-info">
                  <span className="notif-recent-name">Amoxicillin 500mg</span>
                  <span className="notif-recent-sub">Expiring in 3 days • Batch B-0876</span>
                  <span className="notif-recent-time">Apr 24, 2025 • 08:30 AM</span>
                </div>
                <IconChevronRight size={16} className="notif-recent-arrow" />
              </div>

              <div className="notif-recent-item" onClick={() => navigate('/pharmacist/purchases')}>
                <div className="notif-recent-icon" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                  <IconOrders size={15} />
                </div>
                <div className="notif-recent-info">
                  <span className="notif-recent-name">PO-2025-0017</span>
                  <span className="notif-recent-sub">Approved • Global MedTech</span>
                  <span className="notif-recent-time">Apr 24, 2025 • 07:20 AM</span>
                </div>
                <IconChevronRight size={16} className="notif-recent-arrow" />
              </div>
            </div>
          </div>
        </aside>
      </div>
      </>
      )}
    </div>
  );
}
