import React, { useState, useEffect, useCallback } from 'react';
import {
  IconBell,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconPackage,
  IconTruck,
  IconUser,
  IconSettings,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconEye,
  IconHelpCircle,
  IconX,
  IconPill,
  IconFileText,
  IconMail
} from '../../components/icons/Icons';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../services/api';
import EmailPreferencesPanel from '../../components/notifications/EmailPreferencesPanel';
import './StaffCommon.css';

export default function StaffNotificationsPage() {
  const [mainViewTab, setMainViewTab] = useState('alerts'); // alerts | preferences
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Currently expanded/selected notification preview
  const [selectedNotif, setSelectedNotif] = useState(null);

  // Header DateTime
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
    const t = setInterval(updateDateTime, 30000);
    return () => clearInterval(t);
  }, []);

  const defaultNotifications = [
    {
      id: 1,
      datetime: 'Apr 29, 2025 10:45 AM',
      title: 'Low stock alert: Amoxicillin 250mg',
      description: 'The stock level for Amoxicillin 250mg is low. Only 5 units remaining in stock.',
      category: 'Low Stock',
      priority: 'High',
      status: 'Unread',
      relatedItem: 'Medicine',
      medicineName: 'Amoxicillin 250mg',
      currentStock: '5 units',
      reorderLevel: '20 units'
    },
    {
      id: 2,
      datetime: 'Apr 29, 2025 09:30 AM',
      title: 'Medicine expiring soon',
      description: 'Paracetamol 500mg (Batch PCT2024001) will expire within 7 days.',
      category: 'Expiry',
      priority: 'Medium',
      status: 'Unread',
      relatedItem: 'Batch',
      medicineName: 'Paracetamol 500mg',
      currentStock: '50 units',
      reorderLevel: '10 units'
    },
    {
      id: 3,
      datetime: 'Apr 29, 2025 08:12 AM',
      title: 'Purchase order status updated',
      description: 'PO-2025-0048 has been approved and scheduled for delivery.',
      category: 'Purchase Order',
      priority: 'Medium',
      status: 'Unread',
      relatedItem: 'Purchase Order',
      medicineName: 'Various Medicines',
      currentStock: 'N/A',
      reorderLevel: 'N/A'
    },
    {
      id: 4,
      datetime: 'Apr 28, 2025 03:45 PM',
      title: 'New delivery received',
      description: 'Delivery PO-2025-0032 from Cipla Healthcare has arrived.',
      category: 'Delivery',
      priority: 'Low',
      status: 'Read',
      relatedItem: 'Delivery',
      medicineName: 'Consolidated Order',
      currentStock: 'Received',
      reorderLevel: 'N/A'
    },
    {
      id: 5,
      datetime: 'Apr 28, 2025 11:20 AM',
      title: 'Stock adjustment recorded',
      description: 'Quantity adjusted for Ibuprofen 400mg following routine ward count.',
      category: 'Stock',
      priority: 'Medium',
      status: 'Read',
      relatedItem: 'Medicine',
      medicineName: 'Ibuprofen 400mg',
      currentStock: '60 units',
      reorderLevel: '25 units'
    },
    {
      id: 6,
      datetime: 'Apr 27, 2025 04:15 PM',
      title: 'User account created',
      description: 'New staff member added: John Doe to General Ward nursing staff.',
      category: 'User Management',
      priority: 'Low',
      status: 'Read',
      relatedItem: 'User',
      medicineName: 'N/A',
      currentStock: 'N/A',
      reorderLevel: 'N/A'
    },
    {
      id: 7,
      datetime: 'Apr 27, 2025 09:50 AM',
      title: 'System maintenance scheduled',
      description: 'Scheduled database indexing for Apr 30, 2025 at 02:00 AM. Minimal downtime expected.',
      category: 'System',
      priority: 'Medium',
      status: 'Read',
      relatedItem: 'System',
      medicineName: 'N/A',
      currentStock: 'N/A',
      reorderLevel: 'N/A'
    },
    {
      id: 8,
      datetime: 'Apr 26, 2025 02:30 PM',
      title: 'Expiry alert',
      description: 'Metformin 500mg (Batch MET2024008) requires secondary clinical review.',
      category: 'Expiry',
      priority: 'High',
      status: 'Read',
      relatedItem: 'Batch',
      medicineName: 'Metformin 500mg',
      currentStock: '30 units',
      reorderLevel: '15 units'
    }
  ];

  const [items, setItems] = useState(defaultNotifications);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications().catch(() => []);
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
        const mapped = data.map((n, i) => {
          const type = (n.type || '').toUpperCase();
          let cat = 'System';
          if (type.includes('STOCK')) cat = 'Low Stock';
          else if (type.includes('EXPIR')) cat = 'Expiry';
          else if (type.includes('ORDER')) cat = 'Purchase Order';
          return {
            id: n.notificationId || i + 1,
            datetime: n.createdAt ? new Date(n.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent',
            title: n.title,
            description: n.message,
            category: cat,
            priority: n.priority || 'Medium',
            status: n.read || n.isRead ? 'Read' : 'Unread',
            relatedItem: cat,
            medicineName: n.metadata?.medicineName || 'N/A',
            currentStock: n.metadata?.stock || 'N/A',
            reorderLevel: n.metadata?.reorderLevel || 'N/A',
            raw: n
          };
        });
        setItems(mapped);
        setSelectedNotif(mapped[0]);
      } else {
        setItems([]);
        setSelectedNotif(null);
      }
    } catch (_e) {
      setItems([]);
      setSelectedNotif(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    setSelectedNotif(defaultNotifications[0]);
  }, [loadData]);

  const filteredNotifs = items.filter(n => {
    if (search) {
      const s = search.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(s);
      const matchDesc = n.description.toLowerCase().includes(s);
      if (!matchTitle && !matchDesc) return false;
    }
    if (selectedCategory !== 'ALL' && n.category !== selectedCategory) return false;
    if (selectedPriority !== 'ALL' && n.priority !== selectedPriority) return false;
    if (selectedStatus !== 'ALL' && n.status !== selectedStatus) return false;
    return true;
  });

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead().catch(() => { });
    } catch (_e) { }
    setItems(prev => prev.map(n => ({ ...n, status: 'Read' })));
    if (selectedNotif) setSelectedNotif(prev => ({ ...prev, status: 'Read' }));
  };

  const handleMarkItemRead = (id) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' } : n));
    if (selectedNotif && selectedNotif.id === id) {
      setSelectedNotif(prev => ({ ...prev, status: 'Read' }));
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Low Stock':
        return <IconPill size={14} color="#EA580C" />;
      case 'Expiry':
        return <IconClock size={14} color="#9333EA" />;
      case 'Purchase Order':
        return <IconFileText size={14} color="#0284C7" />;
      case 'Delivery':
        return <IconTruck size={14} color="#0D9488" />;
      case 'Stock':
        return <IconPackage size={14} color="#059669" />;
      case 'User Management':
        return <IconUser size={14} color="#7C3AED" />;
      case 'System':
        return <IconSettings size={14} color="#475569" />;
      default:
        return <IconBell size={14} color="#0A6663" />;
    }
  };

  return (
    <div className="admin-page-container fade-in">
      {/* ── Top Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">Notifications</h1>
          <p className="admin-dash-sub">
            View clinical alerts, inventory updates, and operational tasks from the pharmacy system.
          </p>
        </div>
        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime || 'Apr 29, 2025 11:42 AM'}
          </span>
          <button className="clay-action-pill-btn clay-action-pill-btn--secondary" onClick={handleMarkAllRead}>
            <IconCheckCircle size={15} /> Mark All as Read
          </button>
          <button className="clay-action-pill-btn clay-action-pill-btn--secondary" onClick={loadData}>
            <IconRefresh size={15} /> Refresh
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
            background: mainViewTab === 'alerts' ? '#3b82f6' : '#f1f5f9',
            color: mainViewTab === 'alerts' ? '#ffffff' : '#64748b',
            boxShadow: mainViewTab === 'alerts' ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none',
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
            background: mainViewTab === 'preferences' ? '#3b82f6' : '#f1f5f9',
            color: mainViewTab === 'preferences' ? '#ffffff' : '#64748b',
            boxShadow: mainViewTab === 'preferences' ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none',
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
      {/* ── Row 1: 6 Clay Stat Cards ── */}
      <div className="clay-stat-grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {/* Total */}
        <div className="clay-stat-card" onClick={() => setSelectedStatus('ALL')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Total Alerts</span>
            <div className="clay-stat-card__value">24</div>
            <span className="clay-stat-card__sub">All clinical alerts</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--teal">
            <IconBell size={20} />
          </div>
        </div>

        {/* Unread */}
        <div className="clay-stat-card" onClick={() => setSelectedStatus('Unread')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Unread</span>
            <div className="clay-stat-card__value" style={{ color: '#DC2626' }}>3</div>
            <span className="clay-stat-card__sub" style={{ color: '#DC2626', fontWeight: 600 }}>Needs review &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--coral">
            <IconBell size={20} />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="clay-stat-card" onClick={() => setSelectedCategory('Low Stock')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Low Stock</span>
            <div className="clay-stat-card__value" style={{ color: '#EA580C' }}>5</div>
            <span className="clay-stat-card__sub">Replenish stock &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--amber">
            <IconAlertTriangle size={20} />
          </div>
        </div>

        {/* Expiry Alerts */}
        <div className="clay-stat-card" onClick={() => setSelectedCategory('Expiry')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Expiry Alerts</span>
            <div className="clay-stat-card__value" style={{ color: '#9333EA' }}>4</div>
            <span className="clay-stat-card__sub">Check shelf life &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--purple">
            <IconClock size={20} />
          </div>
        </div>

        {/* Purchase Order Updates */}
        <div className="clay-stat-card" onClick={() => setSelectedCategory('Purchase Order')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">Order Updates</span>
            <div className="clay-stat-card__value" style={{ color: '#0284C7' }}>2</div>
            <span className="clay-stat-card__sub">PO progress &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--blue">
            <IconFileText size={20} />
          </div>
        </div>

        {/* System Alerts */}
        <div className="clay-stat-card" onClick={() => setSelectedCategory('System')} style={{ cursor: 'pointer' }}>
          <div className="clay-stat-card__info">
            <span className="clay-stat-card__label">System Health</span>
            <div className="clay-stat-card__value">1</div>
            <span className="clay-stat-card__sub">Diagnostics &rarr;</span>
          </div>
          <div className="clay-stat-card__icon-squircle clay-squircle--mint">
            <IconSettings size={20} />
          </div>
        </div>
      </div>

      {/* ── Main Section: Notifications List (Left) + Categories & Quick Actions (Right) ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        {/* Left: Notifications List */}
        <div className="clay-card-table">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #eef3f8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--teal" style={{ width: 34, height: 34, minWidth: 34 }}>
                <IconBell size={18} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>Notifications List</h3>
            </div>
            <span style={{ fontSize: '0.82rem', color: '#008C8C', fontWeight: 600 }}>Showing {filteredNotifs.length} alerts</span>
          </div>

          {/* Sub filter bar */}
          <div style={{ padding: '12px 20px', background: 'rgba(248, 250, 252, 0.7)', borderBottom: '1px solid #edf2f7', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="clay-search-pill" style={{ flex: '1 1 180px' }}>
              <IconSearch size={15} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.84rem' }}
              />
            </div>

            <select
              className="clay-select-pill"
              style={{ minWidth: 130 }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Expiry">Expiry</option>
              <option value="Purchase Order">Purchase Order</option>
              <option value="Delivery">Delivery</option>
              <option value="Stock">Stock</option>
              <option value="User Management">User Management</option>
              <option value="System">System</option>
            </select>

            <select
              className="clay-select-pill"
              style={{ minWidth: 120 }}
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <select
              className="clay-select-pill"
              style={{ minWidth: 110 }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">Status: All</option>
              <option value="Unread">Unread</option>
              <option value="Read">Read</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 34, textAlign: 'center' }}><input type="checkbox" className="clay-checkbox" /></th>
                  <th>Date &amp; Time</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Related Item</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifs.map((n) => {
                  const isCurrent = selectedNotif && selectedNotif.id === n.id;
                  return (
                    <tr
                      key={n.id}
                      onClick={() => setSelectedNotif(n)}
                      className={isCurrent ? 'staff-row--selected' : ''}
                      style={{ cursor: 'pointer', background: isCurrent ? 'rgba(0, 140, 140, 0.05)' : undefined }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="clay-checkbox" />
                      </td>
                      <td style={{ color: '#64748B', whiteSpace: 'nowrap' }}>{n.datetime}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 26, height: 26, borderRadius: 8,
                            background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {getCategoryIcon(n.category)}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{n.title}</div>
                            <div style={{ fontSize: '0.73rem', color: '#64748B', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {n.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="staff-badge staff-badge--neutral">
                          {n.category}
                        </span>
                      </td>
                      <td>
                        <span className={`staff-badge staff-badge--${n.priority.toLowerCase()}`}>
                          {n.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`staff-badge staff-badge--${n.status.toLowerCase()}`}>
                          {n.status}
                        </span>
                      </td>
                      <td style={{ color: '#475569', fontWeight: 500 }}>{n.relatedItem}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="clay-action-pill-btn clay-action-pill-btn--secondary"
                          style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotif(n);
                          }}
                        >
                          <IconEye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="clay-pagination" style={{ margin: '14px 16px' }}>
            <span>Showing 1-{filteredNotifs.length} of 24 notifications</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="clay-page-btn">&lt;</button>
              <button className="clay-page-btn clay-page-btn--active">1</button>
              <button className="clay-page-btn">2</button>
              <button className="clay-page-btn">3</button>
              <button className="clay-page-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Right: Notification Categories & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Notification Categories */}
          <div className="clay-side-widget">
            <h3 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Notification Categories</h3>
            <div className="staff-ops-list">
              {[
                { name: 'Low Stock Alerts', count: 5, color: '#EA580C', icon: IconAlertTriangle },
                { name: 'Expiry Alerts', count: 4, color: '#9333EA', icon: IconClock },
                { name: 'Purchase Order Updates', count: 2, color: '#0284C7', icon: IconFileText },
                { name: 'Delivery Notifications', count: 2, color: '#0D9488', icon: IconTruck },
                { name: 'User Management', count: 1, color: '#7C3AED', icon: IconUser },
                { name: 'System Notifications', count: 1, color: '#475569', icon: IconSettings },
                { name: 'Other', count: 3, color: '#2563EB', icon: IconBell },
              ].map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={idx}
                    className="staff-ops-item"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCategory(cat.name.replace(' Notifications', '').replace(' Updates', ''))}
                  >
                    <div className="staff-ops-left">
                      <Icon size={15} color={cat.color} />
                      <span>{cat.name}</span>
                    </div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 9999, background: '#F1F5F9',
                      fontSize: '0.76rem', fontWeight: 700, color: '#334155'
                    }}>
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="clay-side-widget">
            <h3 style={{ margin: '0 0 14px', fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleMarkAllRead}>
                <IconCheckCircle size={16} />
                <span>Mark All as Read</span>
              </button>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => setSelectedStatus('Unread')}>
                <IconBell size={16} />
                <span>Filter Unread</span>
              </button>
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={loadData}>
                <IconRefresh size={16} />
                <span>Refresh Feed</span>
              </button>
            </div>
          </div>

          {/* Need Help? */}
          <div className="clay-side-widget">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <IconHelpCircle size={18} color="#008C8C" />
              <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: '#16324F' }}>Need Assistance?</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B', lineHeight: 1.5 }}>
              Contact your pharmacist or system administrator for operational alert escalations.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Active Selected Notification Preview Card ── */}
      {selectedNotif && (
        <div className="clay-card-table" style={{ marginTop: 20, padding: 20, borderLeft: '5px solid #008C8C' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            {/* Left detail */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 280 }}>
              <div className="clay-stat-card__icon-squircle clay-squircle--coral" style={{ width: 44, height: 44, minWidth: 44 }}>
                <IconAlertTriangle size={22} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#16324F' }}>
                    {selectedNotif.title}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{selectedNotif.datetime}</span>
                  <span className={`staff-badge staff-badge--${selectedNotif.priority.toLowerCase()}`}>
                    {selectedNotif.priority} Priority
                  </span>
                  <span className={`staff-badge staff-badge--${selectedNotif.status.toLowerCase()}`}>
                    {selectedNotif.status}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: '0.86rem', color: '#334155', lineHeight: 1.5 }}>
                  {selectedNotif.description}
                </p>

                <div style={{ display: 'flex', gap: 24, fontSize: '0.82rem', marginTop: 6, flexWrap: 'wrap' }}>
                  <div><strong style={{ color: '#64748B' }}>Medicine Name:</strong> <span style={{ fontWeight: 600 }}>{selectedNotif.medicineName}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Current Stock:</strong> <span style={{ fontWeight: 600 }}>{selectedNotif.currentStock}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Reorder Level:</strong> <span style={{ fontWeight: 600 }}>{selectedNotif.reorderLevel}</span></div>
                  <div><strong style={{ color: '#64748B' }}>Related Item:</strong> <span style={{ fontWeight: 600, color: '#008C8C' }}>{selectedNotif.relatedItem}</span></div>
                </div>
              </div>
            </div>

            {/* Right action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {selectedNotif.status === 'Unread' && (
                <button className="clay-action-pill-btn clay-action-pill-btn--primary" onClick={() => handleMarkItemRead(selectedNotif.id)}>
                  <IconCheckCircle size={15} /> Mark Read
                </button>
              )}
              <button className="clay-action-pill-btn clay-action-pill-btn--secondary" onClick={() => setSelectedNotif(null)}>
                <IconX size={15} /> Close
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
