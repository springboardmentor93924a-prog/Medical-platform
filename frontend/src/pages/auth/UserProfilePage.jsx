import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { getCurrentUser, updateUserProfile } from '../../services/api';
import {
  IconUser, IconCheckCircle, IconAlertTriangle, IconShield,
  IconKey, IconClock, IconDatabase
} from '../../components/icons/Icons';
import { normalizeRole, ROLE_CONFIG, ROLES } from '../../utils/roles';
import adminAvatarImg from '../../assets/pending-avatar.jpg';
import '../admin/AdminPages.css';

export default function UserProfilePage() {
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    role: 'STAFF'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Edit fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const remoteProfile = await getCurrentUser();
        if (remoteProfile) {
          setUser(remoteProfile);
          setFormData(prev => ({
            ...prev,
            fullName: remoteProfile.fullName || '',
            phone: remoteProfile.phone || ''
          }));
        }
      } catch (_e) {
        // Fallback to local storage
        const stored = localStorage.getItem('medistock_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            setFormData(prev => ({
              ...prev,
              fullName: parsed.fullName || '',
              phone: parsed.phone || ''
            }));
          } catch (_err) {
            // ignore
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const normRole = normalizeRole(user.role);
  if (normRole === ROLES.SUPPLIER) {
    return <Navigate to="/supplier/profile" replace />;
  }
  const roleConfig = ROLE_CONFIG[normRole] || ROLE_CONFIG.STAFF;

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        setErrorMsg('New password must be at least 8 characters long.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateUserProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        currentPassword: formData.currentPassword || undefined,
        newPassword: formData.newPassword || undefined
      });

      const updatedUser = res?.data || { ...user, fullName: formData.fullName, phone: formData.phone };
      setUser(updatedUser);

      // Update localStorage session
      const stored = localStorage.getItem('medistock_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem('medistock_user', JSON.stringify({
          ...parsed,
          fullName: formData.fullName,
          phone: formData.phone
        }));
      }

      setSuccessMsg('Your personal profile has been successfully updated.');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <h1 className="admin-dash-title">My Personal Profile</h1>
          <p className="admin-dash-sub">
            View your clinical role assignment, update personal contact details, and manage login credentials
          </p>
        </div>
        {normRole === ROLES.ADMIN && (
          <div className="admin-page-header__actions" style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/admin/backup-restore"
              className="admin-btn admin-btn--secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '14px',
                textDecoration: 'none',
                fontWeight: 700
              }}
              id="profile-backup-restore-btn"
            >
              <IconDatabase size={16} />
              <span>Backup & Restore Console</span>
            </Link>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="admin-alert-banner admin-alert-banner--success" style={{ marginBottom: '16px' }}>
          <IconCheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="admin-alert-banner admin-alert-banner--error" style={{ marginBottom: '16px' }}>
          <IconAlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="clay-split-grid" style={{ gridTemplateColumns: '320px minmax(0, 1fr)', gap: '22px' }}>
        {/* Profile Identity Card */}
        <div className="clay-side-widget" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '104px', height: '104px', margin: '8px auto 14px' }}>
            <img
              src={adminAvatarImg}
              alt={user.fullName || 'User Avatar'}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '26px',
                objectFit: 'cover',
                border: '3px solid #008c8c',
                boxShadow: '0 8px 20px rgba(0, 140, 140, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.6)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#10b981',
                border: '3px solid #ffffff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
              }}
              title="Active Clinical Account"
            />
          </div>

          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#16324f' }}>
            {user.fullName || 'Clinical User'}
          </h2>
          <span
            style={{
              display: 'inline-block',
              background: roleConfig.badgeVariant === 'danger' ? '#fee2e2' : (roleConfig.badgeVariant === 'warning' ? '#fef3c7' : '#ccfbf1'),
              color: roleConfig.badgeVariant === 'danger' ? '#b91c1c' : (roleConfig.badgeVariant === 'warning' ? '#b45309' : '#0f766e'),
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: 700,
              boxShadow: '0 2px 6px rgba(16, 46, 89, 0.05), inset 0 1px 1px #ffffff',
              margin: '6px 0 14px'
            }}
          >
            {roleConfig.name}
          </span>

          <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: '#64748b', lineHeight: 1.5, textAlign: 'center' }}>
            {roleConfig.description}
          </p>

          <div style={{ width: '100%', borderTop: '1px solid #eef3f8', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Username:</span>
              <strong style={{ color: '#16324f' }}>{user.username || 'user'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Email:</span>
              <strong style={{ color: '#16324f' }}>{user.email || 'user@medistock.com'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Phone:</span>
              <strong style={{ color: '#16324f' }}>{user.phone || '+92 300 1234567'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b', fontWeight: 500 }}>Role:</span>
              <strong style={{ color: '#008c8c' }}>{normRole}</strong>
            </div>
          </div>

          {normRole === ROLES.ADMIN && (
            <div style={{ width: '100%', borderTop: '1px solid #eef3f8', paddingTop: '16px', marginTop: '16px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <IconDatabase size={16} style={{ color: '#008c8c' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#16324f' }}>Disaster Recovery & Backup</span>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.4 }}>
                Automated MariaDB database snapshots, SHA-256 verification, and point-in-time recovery.
              </p>
              <Link
                to="/admin/backup-restore"
                className="admin-btn admin-btn--secondary"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '9px 14px',
                  fontSize: '0.82rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <IconDatabase size={15} />
                <span>Open Backup Console →</span>
              </Link>
            </div>
          )}
        </div>

        {/* Edit Profile & Password Form */}
        <div className="clay-card-table" style={{ padding: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #eef3f8', paddingBottom: '14px' }}>
            <div className="clay-squircle--teal" style={{ width: '38px', height: '38px', borderRadius: '12px', display: 'grid', placeItems: 'center' }}>
              <IconUser size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#16324f' }}>Edit Personal Information</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>Update contact information and system preferences</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-field">
                <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  className="clay-search-pill"
                  style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem' }}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+92 300 1234567"
                  className="clay-search-pill"
                  style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem' }}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>Email Address (System ID)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="clay-search-pill"
                  style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', opacity: 0.8 }}
                />
              </div>

              <div className="form-field">
                <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>System Role</label>
                <input
                  type="text"
                  disabled
                  value={roleConfig.name}
                  className="clay-search-pill"
                  style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem', background: '#f8fafc', color: '#64748b', cursor: 'not-allowed', opacity: 0.8 }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid #eef3f8', paddingTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <IconKey size={16} style={{ color: '#008c8c' }} />
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#16324f' }}>
                  Change Account Password (Optional)
                </h4>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748b' }}>
                Leave password fields blank if you only wish to update personal contact details.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div className="form-field">
                  <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="clay-search-pill"
                    style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem' }}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>New Password (Min 8 chars)</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="clay-search-pill"
                    style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem' }}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label" style={{ fontWeight: 600, color: '#16324f', fontSize: '0.84rem' }}>Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="clay-search-pill"
                    style={{ width: '100%', height: '42px', padding: '0 16px', borderRadius: '14px', fontSize: '0.88rem' }}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving}
                style={{ padding: '12px 28px', fontSize: '0.92rem', borderRadius: '14px' }}
              >
                <IconCheckCircle size={16} /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
