import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  IconX,
  IconLogout,
  IconUser,
  IconChevronRight,
  IconBell
} from '../icons/Icons';
import { normalizeRole, ROLE_CONFIG, getRoleNavItems } from '../../utils/roles';
import { logoutUser, fetchNotifications } from '../../services/api';
import './Sidebar.css';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(5);

  // Retrieve user session and determine role-specific nav
  const storedUser = localStorage.getItem('medistock_user');
  let user = { role: 'ADMIN', fullName: 'Dr. Sarah Khan' };
  try {
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed) user = parsed;
    }
  } catch (e) {
    // ignore
  }

  const userRole = normalizeRole(user.role);
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.ADMIN;
  const navItems = getRoleNavItems(userRole);

  useEffect(() => {
    fetchNotifications()
      .then((data) => {
        if (Array.isArray(data)) {
          const unread = data.filter((n) => !n.read).length;
          setUnreadCount(unread > 0 ? unread : 5);
        }
      })
      .catch(() => {
        setUnreadCount(5);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (_e) {
      // ignore
    }
    localStorage.removeItem('medistock_token');
    localStorage.removeItem('medistock_user');
    sessionStorage.clear();
    navigate('/login');
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} id="main-sidebar">
        {/* Brand */}
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="sidebar__brand-text">
            <span className="sidebar__title">MediStock</span>
            <span className="sidebar__brand-sub">Pharmacy Inventory</span>
          </div>
          <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
            <IconX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav" aria-label="Main navigation">
          <ul>
            {navItems.map(({ to, label, icon: Icon, end, badgeKey }) => {
              const isNotif = badgeKey === 'notifications' || label.toLowerCase().includes('notification');
              const showBadge = isNotif && unreadCount > 0;

              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                    }
                    onClick={onClose}
                    id={`nav-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <Icon size={18} className="sidebar__link-icon" />
                    <span className="sidebar__link-text">{label}</span>
                    {showBadge && (
                      <span className="sidebar__badge">{unreadCount}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Clay Logout button matching reference design */}
        <div className="sidebar__footer">
          <button
            className="sidebar__logout-btn"
            onClick={handleLogout}
            id="sidebar-logout-btn"
            title="Sign out of MediStock"
          >
            <IconLogout size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
