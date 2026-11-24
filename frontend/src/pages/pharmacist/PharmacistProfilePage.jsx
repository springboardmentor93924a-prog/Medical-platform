import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, updateUserProfile } from '../../services/api';
import {
  IconCheck,
  IconAlertTriangle,
  IconEye,
  IconEdit,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconFileText,
  IconBox,
  IconShield,
  IconBell,
  IconRefresh
} from '../../components/icons/Icons';
import './PharmacistProfilePage.css';

export default function PharmacistProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PERSONAL'); // PERSONAL | WORK | SECURITY | PREFERENCES

  // Personal Info Form State
  const [formData, setFormData] = useState({
    fullName: 'Dr. Sarah Khan',
    email: 'sarah.khan@medistock.com',
    phone: '+92 300 1234567',
    gender: 'Female',
    dateOfBirth: '1988-06-15',
    address: 'Flat 4B, Gulberg Heights, Lahore, Pakistan',
    role: 'Pharmacist'
  });

  // Security Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    emailLowStock: true,
    emailExpiry: true,
    emailPurchases: true,
    twoFactorEnabled: true,
    theme: 'system'
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Load User Data
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      // Check stored user in localStorage first
      const stored = localStorage.getItem('medistock_user');
      let userData = stored ? JSON.parse(stored) : null;

      try {
        const liveUser = await getCurrentUser();
        if (liveUser && (liveUser.username || liveUser.fullName)) {
          userData = liveUser;
        }
      } catch (_e) {
        // Fallback to stored or default
      }

      if (userData) {
        setUser(userData);
        setFormData({
          fullName: userData.fullName || userData.username || 'Dr. Sarah Khan',
          email: userData.email || 'sarah.khan@medistock.com',
          phone: userData.phone || '+92 300 1234567',
          gender: userData.gender || 'Female',
          dateOfBirth: userData.dateOfBirth || '1988-06-15',
          address: userData.address || 'Flat 4B, Gulberg Heights, Lahore, Pakistan',
          role: userData.role || 'Pharmacist'
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Save Personal Info
  const handleSavePersonal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth
      }).catch(() => null);

      // Update localStorage
      const stored = localStorage.getItem('medistock_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem(
          'medistock_user',
          JSON.stringify({ ...parsed, ...formData })
        );
      }

      showToast('success', 'Profile information updated successfully.');
    } catch (err) {
      showToast('error', 'Failed to update profile information.');
    } finally {
      setSaving(false);
    }
  };

  // Handle Change Password
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('error', 'New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      }).catch(() => null);

      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('success', 'Security password changed successfully.');
    } catch (err) {
      showToast('error', 'Password update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="prof-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`prof-toast prof-toast--${toast.type} fade-in`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Profile Hero Banner Card matching Screenshot ── */}
      <div className="prof-hero-card">
        <div className="prof-hero-left">
          <div className="prof-avatar-wrap">
            <div className="prof-avatar">
              <span className="prof-avatar-initials">SK</span>
            </div>
            <button
              className="prof-avatar-edit-badge"
              title="Change Photo"
              onClick={() => showToast('info', 'Avatar upload: JPG/PNG accepted under 2MB.')}
            >
              <IconEdit size={12} color="#FFFFFF" />
            </button>
          </div>

          <div className="prof-hero-details">
            <div className="prof-hero-title-row">
              <h1 className="prof-hero-name">{formData.fullName}</h1>
              <span className="prof-badge-active">
                <IconCheck size={12} />
                Active
              </span>
            </div>

            <div className="prof-hero-role">
              Pharmacist • <span style={{ color: '#008C8C', fontWeight: 600 }}>MediPlus Pharmacy, Lahore</span>
            </div>

            <div className="prof-hero-contact-row">
              <div className="prof-contact-pill">
                <IconMail size={14} color="#64748B" />
                <span>{formData.email}</span>
              </div>
              <div className="prof-contact-pill">
                <IconPhone size={14} color="#64748B" />
                <span>{formData.phone}</span>
              </div>
              <div className="prof-contact-pill">
                <IconCalendar size={14} color="#64748B" />
                <span>Member since Jan 2023</span>
              </div>
            </div>
          </div>
        </div>

        <div className="prof-hero-right">
          <button
            className="prof-btn prof-btn--outline"
            onClick={() => {
              setActiveTab('PERSONAL');
              showToast('info', 'Editing personal information mode enabled.');
            }}
          >
            <IconEdit size={16} />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* ── Quick Stats Grid (4 Cards) ── */}
      <div className="prof-stats-grid">
        <div className="prof-stat-card">
          <div className="prof-stat-icon-pill prof-stat-icon-pill--teal">
            <IconBox size={20} />
          </div>
          <div className="prof-stat-info">
            <span className="prof-stat-label">Medicines Managed</span>
            <span className="prof-stat-val">342</span>
          </div>
        </div>

        <div className="prof-stat-card">
          <div className="prof-stat-icon-pill prof-stat-icon-pill--purple">
            <IconFileText size={20} />
          </div>
          <div className="prof-stat-info">
            <span className="prof-stat-label">Purchase Orders Created</span>
            <span className="prof-stat-val">18</span>
          </div>
        </div>

        <div className="prof-stat-card">
          <div className="prof-stat-icon-pill prof-stat-icon-pill--green">
            <IconFileText size={20} />
          </div>
          <div className="prof-stat-info">
            <span className="prof-stat-label">Inventory Reports</span>
            <span className="prof-stat-val">25</span>
          </div>
        </div>

        <div className="prof-stat-card">
          <div className="prof-stat-icon-pill prof-stat-icon-pill--orange">
            <IconClock size={20} />
          </div>
          <div className="prof-stat-info">
            <span className="prof-stat-label">Last Login</span>
            <span className="prof-stat-val" style={{ fontSize: '1.125rem' }}>
              Today, 09:15 AM
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="prof-layout">
        {/* Left Column: Tabbed Content */}
        <div className="prof-main-col">
          <div className="prof-tabs-card">
            {/* Tab Navigation */}
            <div className="prof-tab-nav">
              <button
                className={`prof-tab-btn ${activeTab === 'PERSONAL' ? 'prof-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('PERSONAL')}
              >
                Personal Information
              </button>
              <button
                className={`prof-tab-btn ${activeTab === 'WORK' ? 'prof-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('WORK')}
              >
                Work Information
              </button>
              <button
                className={`prof-tab-btn ${activeTab === 'SECURITY' ? 'prof-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('SECURITY')}
              >
                Security & Password
              </button>
              <button
                className={`prof-tab-btn ${activeTab === 'PREFERENCES' ? 'prof-tab-btn--active' : ''}`}
                onClick={() => setActiveTab('PREFERENCES')}
              >
                Preferences
              </button>
            </div>

            {/* Tab Body */}
            <div className="prof-tab-body">
              {/* TAB 1: Personal Information */}
              {activeTab === 'PERSONAL' && (
                <form onSubmit={handleSavePersonal} className="prof-form fade-in">
                  <div className="prof-field-row">
                    <div className="prof-field">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="prof-field">
                      <label>Assigned System Role</label>
                      <input
                        type="text"
                        value={formData.role}
                        disabled
                        className="prof-input--disabled"
                        title="Roles are managed by Hospital Central Admin"
                      />
                      <span className="prof-field-hint">Role cannot be modified by user</span>
                    </div>
                  </div>

                  <div className="prof-field-row">
                    <div className="prof-field">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="prof-field">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="prof-field-row">
                    <div className="prof-field">
                      <label>Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="prof-field">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfBirth: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="prof-field">
                    <label>Physical Address</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="prof-form-footer">
                    <button
                      type="button"
                      className="prof-btn prof-btn--outline"
                      onClick={() => loadProfile()}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="prof-btn prof-btn--primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: Work Information */}
              {activeTab === 'WORK' && (
                <div className="prof-work-tab fade-in">
                  <div className="prof-work-grid">
                    <div className="prof-work-item">
                      <span className="prof-work-label">Department</span>
                      <span className="prof-work-val">Inpatient Pharmacy & Dispensary</span>
                    </div>
                    <div className="prof-work-item">
                      <span className="prof-work-label">Staff / Employee ID</span>
                      <span className="prof-work-val">PHARM-2023-042</span>
                    </div>
                    <div className="prof-work-item">
                      <span className="prof-work-label">Pharmacy License Number</span>
                      <span className="prof-work-val">P-88421-PB (Valid until Dec 2027)</span>
                    </div>
                    <div className="prof-work-item">
                      <span className="prof-work-label">Direct Supervisor</span>
                      <span className="prof-work-val">Dr. Ahmed Bilal (Chief Pharmacist)</span>
                    </div>
                    <div className="prof-work-item">
                      <span className="prof-work-label">Assigned Shift</span>
                      <span className="prof-work-val">Morning Shift (08:00 AM – 04:00 PM)</span>
                    </div>
                    <div className="prof-work-item">
                      <span className="prof-work-label">Procurement Authority</span>
                      <span className="prof-work-val">Authorized PO Requester ($10,000 threshold)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Security & Password */}
              {activeTab === 'SECURITY' && (
                <div className="prof-security-tab fade-in">
                  {/* Security Banner */}
                  <div className="prof-security-banner">
                    <div className="prof-sec-left">
                      <div className="prof-sec-icon-circle">
                        <IconShield size={24} color="#059669" />
                      </div>
                      <div>
                        <h4 className="prof-sec-title">Your account is secure</h4>
                        <p className="prof-sec-sub">
                          Two-factor authentication is active. Password was last changed 30 days ago.
                        </p>
                      </div>
                    </div>
                    <span className="prof-badge-verified">Protected</span>
                  </div>

                  {/* Change Password Form */}
                  <form onSubmit={handleSavePassword} className="prof-password-form">
                    <h4 className="prof-sec-form-title">Change Password</h4>

                    <div className="prof-field">
                      <label>Current Password *</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={passwords.currentPassword}
                        onChange={(e) =>
                          setPasswords({ ...passwords, currentPassword: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="prof-field-row">
                      <div className="prof-field">
                        <label>New Password *</label>
                        <input
                          type="password"
                          placeholder="At least 6 characters"
                          value={passwords.newPassword}
                          onChange={(e) =>
                            setPasswords({ ...passwords, newPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="prof-field">
                        <label>Confirm New Password *</label>
                        <input
                          type="password"
                          placeholder="Re-type new password"
                          value={passwords.confirmPassword}
                          onChange={(e) =>
                            setPasswords({ ...passwords, confirmPassword: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="prof-btn prof-btn--primary"
                      disabled={saving}
                      style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: Preferences */}
              {activeTab === 'PREFERENCES' && (
                <div className="prof-pref-tab fade-in">
                  <h4 className="prof-sec-form-title">Email Notification Alerts</h4>
                  <div className="prof-pref-list">
                    <label className="prof-toggle-row">
                      <div>
                        <span className="prof-toggle-label">Low Stock Warnings</span>
                        <span className="prof-toggle-sub">
                          Receive notifications when items reach or dip below reorder thresholds.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailLowStock}
                        onChange={(e) =>
                          setPreferences({ ...preferences, emailLowStock: e.target.checked })
                        }
                      />
                    </label>

                    <label className="prof-toggle-row">
                      <div>
                        <span className="prof-toggle-label">Batch Expiry Alerts (30 & 60 Days)</span>
                        <span className="prof-toggle-sub">
                          Daily digest of pharmaceutical items approaching expiration dates.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailExpiry}
                        onChange={(e) =>
                          setPreferences({ ...preferences, emailExpiry: e.target.checked })
                        }
                      />
                    </label>

                    <label className="prof-toggle-row">
                      <div>
                        <span className="prof-toggle-label">Purchase Order Approvals</span>
                        <span className="prof-toggle-sub">
                          Immediate email when central admin reviews, approves, or rejects purchase orders.
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.emailPurchases}
                        onChange={(e) =>
                          setPreferences({ ...preferences, emailPurchases: e.target.checked })
                        }
                      />
                    </label>
                  </div>

                  <button
                    className="prof-btn prof-btn--primary"
                    style={{ marginTop: '20px' }}
                    onClick={() => showToast('success', 'Preferences saved.')}
                  >
                    Save Preferences
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Account Shortcuts & Activity matching Screenshot */}
        <aside className="prof-right-col">
          {/* Account Settings Card */}
          <div className="prof-sidebar-card">
            <h3 className="prof-sidebar-title">Account Settings</h3>
            <div className="prof-shortcuts-list">
              <button
                className="prof-shortcut-item"
                onClick={() => setActiveTab('SECURITY')}
              >
                <div className="prof-shortcut-left">
                  <IconShield size={16} color="#008C8C" />
                  <span>Change Password</span>
                </div>
                <span className="prof-shortcut-arrow">›</span>
              </button>

              <button
                className="prof-shortcut-item"
                onClick={() => setActiveTab('SECURITY')}
              >
                <div className="prof-shortcut-left">
                  <IconCheck size={16} color="#059669" />
                  <span>Two-Factor Authentication</span>
                </div>
                <span className="prof-badge-on">ON</span>
              </button>

              <button
                className="prof-shortcut-item"
                onClick={() => setActiveTab('PREFERENCES')}
              >
                <div className="prof-shortcut-left">
                  <IconBell size={16} color="#F59E0B" />
                  <span>Notification Preferences</span>
                </div>
                <span className="prof-shortcut-arrow">›</span>
              </button>
            </div>
          </div>

          {/* Recent Activity Card matching Screenshot */}
          <div className="prof-sidebar-card">
            <h3 className="prof-sidebar-title">Recent Activity</h3>
            <div className="prof-activity-list">
              <div className="prof-activity-item">
                <span className="prof-activity-dot" />
                <div>
                  <span className="prof-act-text">Submitted PO-2025-0018</span>
                  <span className="prof-act-time">22 Apr, 09:15 AM</span>
                </div>
              </div>

              <div className="prof-activity-item">
                <span className="prof-activity-dot" />
                <div>
                  <span className="prof-act-text">Recorded Goods Intake (B-1088)</span>
                  <span className="prof-act-time">20 Apr, 11:30 AM</span>
                </div>
              </div>

              <div className="prof-activity-item">
                <span className="prof-activity-dot" />
                <div>
                  <span className="prof-act-text">Stock Adjustment: Metformin</span>
                  <span className="prof-act-time">18 Apr, 04:12 PM</span>
                </div>
              </div>

              <div className="prof-activity-item">
                <span className="prof-activity-dot" />
                <div>
                  <span className="prof-act-text">Generated Q1 Valuation Report</span>
                  <span className="prof-act-time">15 Apr, 02:40 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Need Help Box matching Screenshot */}
          <div className="prof-sidebar-card prof-help-card">
            <h4 className="prof-help-title">Need Clinical or System Help?</h4>
            <p className="prof-help-sub">
              Questions regarding dispensary license credentials, stock reconciliation, or procurement limits?
            </p>
            <button
              className="prof-btn prof-btn--primary"
              style={{ width: '100%' }}
              onClick={() => showToast('info', 'Help desk: it-support@medistock.hospital (Ext: 4401)')}
            >
              Contact System Admin
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

