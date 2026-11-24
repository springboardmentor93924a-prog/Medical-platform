import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconUser,
  IconLock,
  IconHistory,
  IconLogout,
  IconCheckCircle,
  IconBriefcase,
  IconCamera,
  IconUpload,
  IconMail,
  IconPhone,
  IconShield,
  IconChevronRight,
  IconSave
} from '../../components/icons/Icons';
import { logoutUser } from '../../services/api';
import './StaffCommon.css';

export default function StaffProfilePage() {
  const navigate = useNavigate();

  // Retrieve user session
  const storedUser = localStorage.getItem('medistock_user');
  let currentUser = {
    fullName: 'Sarah Khan',
    email: 'sarah.khan@medistock.com',
    role: 'Staff',
    phone: '+92 300 1234567',
    department: 'Pharmacy Operations',
    employeeId: 'STF-00123',
    username: 'sarah.khan',
    lastLogin: 'Apr 29, 2025 10:15 AM'
  };

  try {
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed) {
        currentUser = {
          ...currentUser,
          ...parsed,
          fullName: parsed.fullName || currentUser.fullName,
          email: parsed.email || currentUser.email
        };
      }
    }
  } catch (_e) {}

  const [formData, setFormData] = useState({
    fullName: currentUser.fullName,
    department: currentUser.department,
    email: currentUser.email,
    role: 'Staff',
    phone: currentUser.phone,
    employeeId: currentUser.employeeId
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    try {
      const updated = { ...currentUser, ...formData };
      localStorage.setItem('medistock_user', JSON.stringify(updated));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (_e) {}
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <div className="staff-portal-container">
      {/* ── Top Header ── */}
      <div className="staff-header-row">
        <div className="staff-header-left">
          <div className="staff-header-icon-badge">
            <IconUser size={22} />
          </div>
          <div>
            <h1 className="staff-header-title">My Profile</h1>
            <p className="staff-header-subtitle">
              View and update your profile information (permitted fields only).
            </p>
          </div>
        </div>
        <div className="staff-header-meta">
          <span className="staff-header-datetime">{dateTime || 'Apr 29, 2025 11:42 AM'}</span>
          <span className="staff-header-online-status">
            <span className="staff-online-dot"></span> System Online
          </span>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: '12px 18px',
          background: '#DCFCE7',
          color: '#166534',
          borderRadius: 10,
          border: '1px solid #BBF7D0',
          fontWeight: 500,
          fontSize: '0.86rem'
        }}>
          Profile changes saved successfully.
        </div>
      )}

      {/* ── Top Section: Profile Header & Account Info (Left) + Quick Actions (Right) ── */}
      <div className="staff-split-layout">
        {/* Left: User Overview & Account Information Card */}
        <div className="staff-card">
          <div className="staff-card-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center' }}>
            {/* User Profile summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
                {/* Avatar SVG/Circle */}
                <div style={{
                  width: '100%', height: '100%', borderRadius: '50%',
                  background: '#0D9488', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#FFFFFF', fontSize: '2rem',
                  fontWeight: 700, boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)'
                }}>
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'S'}
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: '#0F4A47', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'pointer'
                }}>
                  <IconCamera size={13} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0F172A' }}>
                  {formData.fullName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Staff</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4, fontSize: '0.78rem', color: '#475569' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconMail size={13} color="#0D9488" />
                    <span>{formData.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconPhone size={13} color="#0D9488" />
                    <span>{formData.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconBriefcase size={13} color="#0D9488" />
                    <span>{formData.department}</span>
                  </div>
                </div>

                <div style={{ marginTop: 6 }}>
                  <span className="staff-badge staff-badge--active">
                    <span className="staff-badge-dot"></span> Active
                  </span>
                </div>
              </div>
            </div>

            {/* Account Information Box */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0F4A47', fontSize: '0.84rem', marginBottom: 12 }}>
                <IconShield size={16} />
                <span>Account Information</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Username</span>
                  <span style={{ fontWeight: 600, color: '#0F172A' }}>{currentUser.username}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Last Login</span>
                  <span style={{ fontWeight: 500, color: '#475569' }}>{currentUser.lastLogin}</span>
                </div>
                <div>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.74rem' }}>Account Status</span>
                  <span style={{ color: '#16A34A', fontWeight: 600, fontSize: '0.8rem' }}>&diams; Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions Card */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon" style={{ color: '#0A6663' }}>
                <IconLock size={18} />
              </span>
              <h3 className="staff-card-title">Quick Actions</h3>
            </div>
          </div>
          <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="staff-btn staff-btn--outline staff-btn--full"
              style={{ justifyContent: 'space-between', padding: '12px 14px' }}
              onClick={() => setShowPasswordModal(true)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconLock size={16} color="#0D9488" />
                <span>Change Password</span>
              </div>
              <IconChevronRight size={16} color="#94A3B8" />
            </button>

            <button
              className="staff-btn staff-btn--outline staff-btn--full"
              style={{ justifyContent: 'space-between', padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconCamera size={16} color="#0284C7" />
                <span>Update Profile Picture</span>
              </div>
              <IconChevronRight size={16} color="#94A3B8" />
            </button>

            <button
              className="staff-btn staff-btn--outline staff-btn--full"
              style={{ justifyContent: 'space-between', padding: '12px 14px' }}
              onClick={() => navigate('/staff/notifications')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconHistory size={16} color="#475569" />
                <span>View Activity Log</span>
              </div>
              <IconChevronRight size={16} color="#94A3B8" />
            </button>

            <button
              className="staff-btn staff-btn--outline staff-btn--full"
              style={{ justifyContent: 'space-between', padding: '12px 14px', color: '#DC2626' }}
              onClick={handleLogout}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconLogout size={16} color="#DC2626" />
                <span>Logout</span>
              </div>
              <IconChevronRight size={16} color="#DC2626" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Middle Section: Personal Information (Left) + Your Permissions (Right) ── */}
      <div className="staff-split-layout">
        {/* Left: Personal Information Form */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconUser size={18} />
              </span>
              <h3 className="staff-card-title">Personal Information</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="staff-form-group">
                  <label className="staff-form-label">Full Name *</label>
                  <input
                    type="text"
                    className="staff-form-input"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Department *</label>
                  <select
                    className="staff-select-control"
                    style={{ width: '100%' }}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="Pharmacy Operations">Pharmacy Operations</option>
                    <option value="General Ward 3">General Ward 3</option>
                    <option value="ICU Clinical Ward">ICU Clinical Ward</option>
                    <option value="Emergency Care">Emergency Care</option>
                  </select>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Email Address *</label>
                  <input
                    type="email"
                    className="staff-form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Role *</label>
                  <select className="staff-select-control" style={{ width: '100%' }} disabled value="Staff">
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="staff-form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Employee ID</label>
                  <input
                    type="text"
                    className="staff-form-input"
                    value={formData.employeeId}
                    disabled
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="submit" className="staff-btn staff-btn--primary">
                  <IconSave size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Your Permissions Card */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon" style={{ color: '#0A6663' }}>
                <IconShield size={18} />
              </span>
              <h3 className="staff-card-title">Your Permissions</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'View medicines',
                'Search medicines',
                'Stock checking (view only)',
                'Receive medicines (view only)',
                'Expiry checking (report only)',
                'View notifications',
                'Update profile (limited)'
              ].map((perm, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.84rem', color: '#1E293B' }}>
                  <IconCheckCircle size={16} color="#16A34A" />
                  <span>{perm}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Work Information + Profile Picture + Recent Activity ── */}
      <div className="staff-3col-layout">
        {/* Col 1: Work Information */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconBriefcase size={18} />
              </span>
              <h3 className="staff-card-title">Work Information</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <div className="staff-ops-list">
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Joining Date</span>
                <span className="staff-ops-val">Jan 15, 2025</span>
              </div>
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Shift</span>
                <span className="staff-ops-val">Morning (08:00 AM - 04:00 PM)</span>
              </div>
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Location</span>
                <span className="staff-ops-val">Main Pharmacy</span>
              </div>
              <div className="staff-ops-item">
                <span style={{ color: '#64748B' }}>Supervisor</span>
                <span className="staff-ops-val">Ahmed Raza (Pharmacist)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Profile Picture Upload Box */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconCamera size={18} />
              </span>
              <h3 className="staff-card-title">Profile Picture</h3>
            </div>
          </div>
          <div className="staff-card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#0D9488', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#FFFFFF', fontSize: '1.75rem',
              fontWeight: 700
            }}>
              {currentUser.fullName ? currentUser.fullName.charAt(0) : 'S'}
            </div>
            <button className="staff-btn staff-btn--outline" style={{ padding: '7px 14px' }}>
              <IconUpload size={14} /> Change Picture
            </button>
            <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
              JPG, PNG (Max 2MB)
            </span>
          </div>
        </div>

        {/* Col 3: Recent Activity */}
        <div className="staff-card">
          <div className="staff-card-header">
            <div className="staff-card-title-group">
              <span className="staff-card-title-icon">
                <IconHistory size={18} />
              </span>
              <h3 className="staff-card-title">Recent Activity</h3>
            </div>
          </div>
          <div className="staff-card-body">
            <div className="staff-timeline">
              <div className="staff-timeline-item">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0D9488', marginTop: 5 }}></div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Logged in to the system</span>
                  <span className="staff-timeline-sub">Apr 29, 2025 10:15 AM</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', marginTop: 5 }}></div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Viewed medicine details (Paracetamol 500mg)</span>
                  <span className="staff-timeline-sub">Apr 29, 2025 09:42 AM</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', marginTop: 5 }}></div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Searched for medicines (Amoxicillin)</span>
                  <span className="staff-timeline-sub">Apr 28, 2025 04:21 PM</span>
                </div>
              </div>
              <div className="staff-timeline-item">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D97706', marginTop: 5 }}></div>
                <div className="staff-timeline-content">
                  <span className="staff-timeline-title">Updated profile information</span>
                  <span className="staff-timeline-sub">Apr 27, 2025 11:03 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Password Modal ── */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="staff-card" style={{ width: '100%', maxWidth: 440 }}>
            <div className="staff-card-header">
              <div className="staff-card-title-group">
                <IconLock size={18} color="#0D9488" />
                <h3 className="staff-card-title">Change Password</h3>
              </div>
            </div>
            <div className="staff-card-body">
              {passwordFeedback && (
                <div style={{ padding: '8px 12px', background: '#DCFCE7', color: '#166534', borderRadius: 8, fontSize: '0.82rem', marginBottom: 12 }}>
                  {passwordFeedback}
                </div>
              )}
              <div className="staff-form-group">
                <label className="staff-form-label">Current Password</label>
                <input type="password" className="staff-form-input" placeholder="••••••••" />
              </div>
              <div className="staff-form-group">
                <label className="staff-form-label">New Password</label>
                <input type="password" className="staff-form-input" placeholder="••••••••" />
              </div>
              <div className="staff-form-group">
                <label className="staff-form-label">Confirm New Password</label>
                <input type="password" className="staff-form-input" placeholder="••••••••" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button className="staff-btn staff-btn--outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button
                  className="staff-btn staff-btn--primary"
                  onClick={() => {
                    setPasswordFeedback('Password updated successfully.');
                    setTimeout(() => {
                      setPasswordFeedback(null);
                      setShowPasswordModal(false);
                    }, 1500);
                  }}
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

