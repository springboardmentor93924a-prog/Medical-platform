import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconSearch,
  IconBell,
  IconMenu,
  IconUser,
  IconCalendar,
  IconCheckCircle,
  IconSparkles
} from '../icons/Icons';
import { normalizeRole, ROLE_CONFIG } from '../../utils/roles';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/api';
import { wsService } from '../../services/websocket';
import MediStockChatDrawer from '../ai/MediStockChatDrawer';
import './Topbar.css';

export default function Topbar({ pageTitle, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [liveToast, setLiveToast] = useState(null);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [dateTime, setDateTime] = useState({
    date: 'Apr 24, 2025',
    time: '10:30 AM',
  });

  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Keep live date & time
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      setDateTime({ date: dateStr, time: timeStr });
    }
    updateClock();
    const timer = setInterval(updateClock, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load real notifications from backend
  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (_e) {
      // offline / fallback
    }
  };

  useEffect(() => {
    loadNotifications();

    // 1. Monitor WebSocket status
    const unsubStatus = wsService.onStatusChange((connected) => {
      setIsLive(connected);
    });

    // 2. State recovery on reconnection
    const unsubReconnect = wsService.onReconnect(() => {
      console.log('[Topbar] Recovering notifications after WebSocket reconnection');
      loadNotifications();
    });

    // 3. Subscribe to real-time notification push
    const unsubNotifs = wsService.subscribeNotifications((evt) => {
      console.log('[Topbar] Real-time notification received:', evt);
      const notifData = evt?.data || evt;
      if (notifData && (notifData.title || notifData.message)) {
        setNotifications((prev) => [notifData, ...prev.filter((p) => p.notificationId !== notifData.notificationId)]);
        setUnreadCount((c) => c + 1);
        setLiveToast({
          title: notifData.title || 'System Alert',
          message: notifData.message || 'New update available',
        });
        setTimeout(() => setLiveToast(null), 5000);
      } else {
        loadNotifications();
      }
    });

    return () => {
      unsubStatus();
      unsubReconnect();
      unsubNotifs();
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Listen for open-medistock-ai custom event from dashboard cards
  useEffect(() => {
    const handleOpenAi = () => {
      setChatDrawerOpen(true);
    };
    window.addEventListener('open-medistock-ai', handleOpenAi);
    return () => window.removeEventListener('open-medistock-ai', handleOpenAi);
  }, []);

  // Pull user info from localStorage
  const stored = localStorage.getItem('medistock_user');
  let user = { fullName: 'Dr. Sarah Khan', role: 'ADMIN', email: 'admin@medistock.com' };
  try {
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed) user = parsed;
    }
  } catch (_e) {
    // fallback
  }

  const userRole = normalizeRole(user.role);
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.ADMIN;

  async function handleMarkRead(id, e) {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  }

  function handleNotificationClick(n) {
    if (!n.read) handleMarkRead(n.notificationId);
    setNotifOpen(false);

    const basePath = userRole === 'PHARMACIST' ? '/pharmacist' : userRole === 'ADMIN' ? '/admin' : userRole === 'SUPPLIER' ? '/supplier' : '/staff';

    if (n.relatedEntityType === 'PURCHASE_ORDER') {
      navigate(userRole === 'SUPPLIER' ? '/supplier/orders' : `${basePath}/purchases`);
    } else if (n.relatedEntityType === 'BATCH') {
      navigate(userRole === 'SUPPLIER' ? '/supplier/deliveries' : `${basePath}/expiry`);
    } else if (n.notificationType === 'LOW_STOCK') {
      navigate(userRole === 'SUPPLIER' ? '/supplier/orders' : `${basePath}/stock`);
    } else {
      navigate(`${basePath}/notifications`);
    }
  }

  function handleSearchSubmit(e) {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const basePath = userRole === 'PHARMACIST' ? '/pharmacist/medicines' : userRole === 'ADMIN' ? '/admin/medicines' : '/staff/search';
      navigate(`${basePath}?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const profileRoute =
    userRole === 'PHARMACIST' ? '/pharmacist/profile' :
    userRole === 'ADMIN' ? '/admin/profile' :
    userRole === 'SUPPLIER' ? '/supplier/profile' :
    '/staff/profile';

  return (
    <header className="topbar" id="main-topbar">
      {/* Mobile Hamburger */}
      <button className="topbar__menu-btn" onClick={onMenuClick} aria-label="Open sidebar">
        <IconMenu size={22} />
      </button>

      {/* Global Search Bar matching reference mockup */}
      <div className="topbar__search" id="topbar-search">
        <IconSearch size={16} className="topbar__search-icon" />
        <input
          type="text"
          placeholder="Search medicines, suppliers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          aria-label="Search"
        />
      </div>

      {/* Right Controls: Status Toggle, Notifications, Live Date/Time, My Profile */}
      <div className="topbar__right">
        {/* Status Toggle Switch matching reference mockup */}
        <div className="topbar__status-container" title={isLive ? 'System Status: Operational' : 'System Syncing'}>
          <span className="topbar__status-label">Status</span>
          <div className="topbar__status-toggle">
            <span className="topbar__status-toggle-dot" />
          </div>
        </div>

        {/* Live Notification Toast Popover */}
        {liveToast && (
          <div
            style={{
              position: 'fixed',
              top: 74,
              right: 28,
              zIndex: 9999,
              background: '#0F4A47',
              color: '#FFFFFF',
              padding: '12px 18px',
              borderRadius: 10,
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxWidth: 380,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.15)'
            }}
            onClick={() => setLiveToast(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34D399' }}>🔔 {liveToast.title}</span>
              <span style={{ cursor: 'pointer', fontSize: '0.75rem', opacity: 0.7 }}>✕</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.9 }}>{liveToast.message}</p>
          </div>
        )}

        {/* AI Assistant Chat Launcher for All Authorized Roles (Admin, Pharmacist, Staff, Supplier) */}
        {(userRole === 'ADMIN' || userRole === 'PHARMACIST' || userRole === 'STAFF' || userRole === 'SUPPLIER') && (
          <button
            className="topbar__ai-btn"
            aria-label="MediStock AI Assistant"
            title={`Open MediStock AI Assistant (${userRole === 'STAFF' ? 'Staff Inventory' : userRole === 'SUPPLIER' ? 'Supplier Portal' : 'Clinical'})`}
            onClick={() => setChatDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: userRole === 'SUPPLIER' ? '#eff6ff' : userRole === 'STAFF' ? '#f0fdf4' : '#f0fdfa',
              border: `1px solid ${userRole === 'SUPPLIER' ? '#bfdbfe' : userRole === 'STAFF' ? '#bbf7d0' : '#ccfbf1'}`,
              color: userRole === 'SUPPLIER' ? '#2563eb' : userRole === 'STAFF' ? '#16a34a' : '#0d9488',
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.08)',
              transition: 'all 0.15s ease'
            }}
          >
            <IconSparkles size={16} color={userRole === 'SUPPLIER' ? '#2563eb' : userRole === 'STAFF' ? '#16a34a' : '#0d9488'} />
            <span>{userRole === 'STAFF' ? 'Staff AI' : userRole === 'SUPPLIER' ? 'Supplier AI' : 'AI Assistant'}</span>
          </button>
        )}

        {/* Notification Bell with Red Badge */}
        <div className="topbar__notif-wrapper" ref={notifRef}>
          <button
            className="topbar__icon-btn"
            aria-label="Notifications"
            id="topbar-notifications"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <IconBell size={18} />
            {unreadCount > 0 && (
              <span className="topbar__badge" id="topbar-unread-badge">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="topbar__notif-dropdown fade-in" id="topbar-notif-dropdown">
              <div className="topbar__notif-header">
                <div>
                  <h4>System Notifications</h4>
                  <span>
                    {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button className="topbar__notif-mark-btn" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              <div className="topbar__notif-list">
                {notifications.length === 0 ? (
                  <div className="topbar__notif-empty">
                    No notifications at this time.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.notificationId}
                      className={`topbar__notif-item ${!n.read ? 'topbar__notif-item--unread' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="topbar__notif-content">
                        <div className="topbar__notif-title-row">
                          <span className="topbar__notif-item-title">{n.title}</span>
                          {!n.read && <span className="topbar__notif-unread-dot" />}
                        </div>
                        <p className="topbar__notif-msg">{n.message}</p>
                        <span className="topbar__notif-time">
                          {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="topbar__notif-footer">
                <button
                  className="topbar__notif-view-all"
                  onClick={() => {
                    setNotifOpen(false);
                    const basePath = userRole === 'PHARMACIST' ? '/pharmacist' : userRole === 'ADMIN' ? '/admin' : userRole === 'SUPPLIER' ? '/supplier' : '/staff';
                    navigate(`${basePath}/notifications`);
                  }}
                >
                  View All Notifications →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Date and Time matching reference designs */}
        <div className="topbar__datetime">
          <IconCalendar size={18} className="topbar__datetime-icon" />
          <div className="topbar__datetime-text">
            <span className="topbar__datetime-date">{dateTime.date}</span>
            <span className="topbar__datetime-time">{dateTime.time}</span>
          </div>
        </div>

        <div className="topbar__divider" />

        {/* Exactly ONE My Profile button in the top-right header across all roles */}
        <button
          className="topbar__my-profile-btn"
          onClick={() => navigate(profileRoute)}
          id="topbar-my-profile-btn"
          title="Open My Profile"
        >
          <IconUser size={16} />
          <span>My Profile</span>
        </button>
      </div>

      <MediStockChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
      />
    </header>
  );
}
