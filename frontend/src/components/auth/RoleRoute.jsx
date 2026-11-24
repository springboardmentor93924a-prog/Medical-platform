import { Navigate, useNavigate } from 'react-router-dom';
import { normalizeRole, ROLE_CONFIG, getRoleDashboardPath } from '../../utils/roles';
import { IconShield, IconLogout, IconChevronRight } from '../icons/Icons';
import StatusBadge from '../ui/StatusBadge';
import './RoleRoute.css';

/**
 * Role-based route guard.
 *
 * Verifies that the authenticated user possesses one of the `allowedRoles`.
 * If unauthenticated -> redirects to /login.
 * If unauthorized -> shows clear Access Denied notice with action to return to their dashboard.
 */
export default function RoleRoute({ allowedRoles, children }) {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('medistock_user');

  if (!storedUser) {
    return <Navigate to="/login" replace />;
  }

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch (err) {
    localStorage.removeItem('medistock_user');
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(user.role);
  const isAllowed = allowedRoles.map(normalizeRole).includes(userRole);

  if (!isAllowed) {
    const userRoleConfig = ROLE_CONFIG[userRole] || {};
    const targetRolesString = allowedRoles.map((r) => ROLE_CONFIG[normalizeRole(r)]?.name || r).join(' or ');

    return (
      <div className="access-denied-container fade-in">
        <div className="access-denied-card">
          <div className="access-denied-icon">
            <IconShield size={44} />
          </div>
          <h2>Access Restricted</h2>
          <p className="access-denied-desc">
            This module requires <strong>{targetRolesString}</strong> permissions.
          </p>

          <div className="access-denied-identity">
            <span className="identity-label">Current Session:</span>
            <span className="identity-name">{user.fullName || user.email}</span>
            <StatusBadge
              variant={userRoleConfig.badgeVariant || 'neutral'}
              label={userRoleConfig.label || userRole}
            />
          </div>

          <p className="access-denied-help">
            Security policy restricts unauthorized access to administrative or private vendor endpoints.
          </p>

          <div className="access-denied-actions">
            <button
              className="btn btn--primary"
              onClick={() => navigate(getRoleDashboardPath(userRole))}
            >
              Go to My Dashboard ({userRoleConfig.name || 'Dashboard'})
              <IconChevronRight size={16} />
            </button>
            <button
              className="btn btn--outline"
              onClick={() => {
                localStorage.removeItem('medistock_token');
                localStorage.removeItem('medistock_user');
                navigate('/login');
              }}
            >
              <IconLogout size={16} />
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
