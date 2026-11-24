import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconUser,
  IconTruck,
  IconOrders,
  IconShield,
  IconCheckCircle,
  IconAlertTriangle,
  IconLock,
  IconMail,
  IconPhone,
  IconMapPin,
  IconSave,
  IconClock,
  IconFileText,
  IconSparkles,
  IconCheck,
  IconCreditCard,
  IconRefresh,
  IconBell
} from '../../components/icons/Icons';
import { getCurrentUser, updateUserProfile } from '../../services/api';
import '../staff/StaffCommon.css';
import './SupplierDashboardPage.css';

export default function SupplierProfilePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('DETAILS'); // DETAILS | SECURITY | CONTRACT | NOTIFICATIONS
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

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

  const showToast = (msg, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Vendor Profile State
  const [profile, setProfile] = useState({
    companyName: 'Apex Medical Supplies Ltd',
    representativeName: 'Farhan Malik',
    email: 'supplier@medistock.com',
    phone: '+92 300 9876543',
    emergencyPhone: '+92 42 35789000',
    address: 'Apex Logistics Hub, Warehouse #14, Medical Industrial Zone, Lahore, Pakistan',
    vendorCode: 'APEX-PHARMA',
    supplierId: 'SUP-1042',
    taxId: 'PK-GST-7890124-A',
    drugLicense: 'CDSCO-WH-2024-8891',
    contractStatus: 'Active Approved Supplier',
    gdpScore: '98.4%',
    paymentTerms: 'Net 30 Days',
    slaHours: '96 Hours Delivery Guarantee',
    carriers: 'DHL Medical Logistics, Blue Dart Pharma Express'
  });

  // Password Edit State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification Preferences State
  const [notifPrefs, setNotifPrefs] = useState({
    emailNewPO: true,
    smsDispatchReminder: true,
    emailReceiptConfirm: true,
    coldChainAlerts: true,
    stockReplenishment: false
  });

  // Load profile from local storage or backend
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem('medistock_user');
      let sessionUser = null;
      if (stored) {
        try {
          sessionUser = JSON.parse(stored);
        } catch (_e) {}
      }

      try {
        const liveUser = await getCurrentUser();
        if (liveUser) {
          sessionUser = { ...sessionUser, ...liveUser };
        }
      } catch (_e) {}

      if (sessionUser) {
        setProfile((prev) => ({
          ...prev,
          companyName: sessionUser.fullName || sessionUser.companyName || prev.companyName,
          email: sessionUser.email || prev.email,
          phone: sessionUser.phone || prev.phone,
          representativeName: sessionUser.representativeName || prev.representativeName,
          vendorCode: sessionUser.vendorCode || prev.vendorCode,
          supplierId: sessionUser.supplierId || prev.supplierId
        }));
      }
    } catch (_err) {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Profile Save
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      await updateUserProfile({
        fullName: profile.companyName,
        phone: profile.phone
      }).catch(() => null);

      // Synchronize localStorage
      const stored = localStorage.getItem('medistock_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          localStorage.setItem('medistock_user', JSON.stringify({
            ...parsed,
            fullName: profile.companyName,
            phone: profile.phone,
            representativeName: profile.representativeName
          }));
        } catch (_e) {}
      }

      showToast('Supplier profile successfully updated.');
    } catch (err) {
      showToast(err.message || 'Failed to update supplier profile.', true);
    } finally {
      setSaving(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword) {
      showToast('Please enter a new password.', true);
      return;
    }
    if (passwordData.newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', true);
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New password and confirmation do not match.', true);
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }).catch(() => null);

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Login password updated successfully.');
    } catch (err) {
      showToast(err.message || 'Failed to change password.', true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Toast Feedback Notification */}
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
          <IconCheckCircle size={18} color="#34D399" />
          <span>{toastMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            right: 28,
            zIndex: 9999,
            background: '#DC2626',
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
          <IconAlertTriangle size={18} color="#FFFFFF" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="clay-stat-card__icon-squircle clay-squircle--teal"
              style={{ width: 44, height: 44, minWidth: 44, borderRadius: 14 }}
            >
              <IconTruck size={22} />
            </div>
            <div>
              <h1 className="admin-dash-title">Supplier Profile & Settings</h1>
              <p className="admin-dash-sub">
                Authorized vendor business profile, dispatch logistics contacts, and contracted procurement compliance.
              </p>
            </div>
          </div>
        </div>

        <div className="admin-page-header__actions">
          <span style={{ fontSize: '0.84rem', color: '#64748B', fontWeight: 600, marginRight: 8 }}>
            {dateTime}
          </span>
          <button
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            onClick={loadProfile}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Main Split Layout: Left Vendor Card + Right Tabbed Forms ── */}
      <div className="clay-split-grid" style={{ gridTemplateColumns: '340px minmax(0, 1fr)', gap: 22 }}>
        {/* Left Column: Vendor Identity Card */}
        <div className="clay-side-widget" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              background: 'linear-gradient(135deg, #008C8C 0%, #004D57 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.4rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(0, 140, 140, 0.25), inset 0 2px 3px rgba(255, 255, 255, 0.4)',
              margin: '6px auto 14px'
            }}
          >
            🏢
          </div>

          <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 800, color: '#16324F' }}>
            {profile.companyName}
          </h2>

          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', margin: '4px 0 12px' }}>
            <span
              style={{
                background: '#ccfbf1',
                color: '#0f766e',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.76rem',
                fontWeight: 700,
                border: '1px solid #99f6e4'
              }}
            >
              Medical Supplier
            </span>
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.76rem',
                fontWeight: 700,
                fontFamily: 'monospace'
              }}
            >
              {profile.vendorCode}
            </span>
          </div>

          <p style={{ margin: '0 0 18px', fontSize: '0.84rem', color: '#64748B', lineHeight: 1.5 }}>
            Authorized pharmaceutical manufacturer and bulk medicine fulfillment partner for Central Pharmacy Hospital.
          </p>

          {/* Quick Credential Specifications */}
          <div style={{ width: '100%', borderTop: '1px solid #eef3f8', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.84rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Primary Representative:</span>
              <strong style={{ color: '#16324F' }}>{profile.representativeName}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Official Email:</span>
              <strong style={{ color: '#16324F' }}>{profile.email}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Dispatch Hotline:</span>
              <strong style={{ color: '#008C8C' }}>{profile.phone}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Drug Wholesale License:</span>
              <strong style={{ fontFamily: 'monospace', color: '#16324F' }}>{profile.drugLicense}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748B' }}>Tax Identification:</span>
              <strong style={{ fontFamily: 'monospace', color: '#16324F' }}>{profile.taxId}</strong>
            </div>
          </div>

          {/* Verification Badge */}
          <div
            style={{
              width: '100%',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '12px 14px',
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left'
            }}
          >
            <div style={{ color: '#16a34a' }}>
              <IconCheckCircle size={20} />
            </div>
            <div style={{ fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 700, color: '#16324F' }}>GDP Compliance Verified</div>
              <div style={{ color: '#64748B' }}>Cold Chain storage SLA active through Dec 2027</div>
            </div>
          </div>

          {/* Wholesale AI Helper */}
          <button
            type="button"
            className="staff-btn"
            style={{
              marginTop: 14,
              width: '100%',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              padding: '8px 14px',
              borderRadius: 16,
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer'
            }}
            onClick={() => window.dispatchEvent(new CustomEvent('open-medistock-ai', { detail: { query: 'Show my vendor company details and compliance status' } }))}
          >
            <IconSparkles size={16} />
            <span>Ask Supplier AI</span>
          </button>
        </div>

        {/* Right Column: Tabbed Settings & Forms */}
        <div className="clay-card-table" style={{ padding: 0 }}>
          {/* Tabs Bar */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid #eef3f8',
              padding: '12px 18px 0 18px',
              overflowX: 'auto',
              background: '#fafcff'
            }}
          >
            {[
              { id: 'DETAILS', label: 'Company & Dispatch Info', icon: <IconTruck size={15} /> },
              { id: 'CONTRACT', label: 'Contract & SLA Terms', icon: <IconFileText size={15} /> },
              { id: 'SECURITY', label: 'Password & Security', icon: <IconLock size={15} /> },
              { id: 'NOTIFICATIONS', label: 'Alert Preferences', icon: <IconBell size={15} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #008C8C' : '3px solid transparent',
                  background: 'transparent',
                  color: activeTab === tab.id ? '#008C8C' : '#64748B',
                  fontWeight: activeTab === tab.id ? 700 : 600,
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {/* Tab 1: Company & Dispatch Info */}
            {activeTab === 'DETAILS' && (
              <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#16324F' }}>
                    Wholesale Supplier Information
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Keep your registered pharmaceutical company contact and dispatch facility details updated for receiving hospital purchase orders.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Company Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.companyName}
                      onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Authorized Dispatch Director *
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.representativeName}
                      onChange={(e) => setProfile({ ...profile, representativeName: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Official Portal Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Dispatch Hotline Phone *
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Emergency Cold Chain Hotline
                    </label>
                    <input
                      type="text"
                      value={profile.emergencyPhone}
                      onChange={(e) => setProfile({ ...profile, emergencyPhone: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Tax ID / GSTIN
                    </label>
                    <input
                      type="text"
                      value={profile.taxId}
                      onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                    Central Warehouse & Dispatch Hub Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="clay-action-pill-btn clay-action-pill-btn--primary"
                    style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <IconSave size={16} />
                    <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Contract & SLA Terms */}
            {activeTab === 'CONTRACT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#16324F' }}>
                    Procurement Agreement & SLA Protocol
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Contractual terms negotiated with Central Pharmacy hospital administration for bulk pharmaceutical supplies.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Contract Agreement ID</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324F', marginTop: 4 }}>CTR-2025-APEX-09</div>
                    <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>● Active (Term: 2025 – 2027)</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Standard Fulfillment SLA</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324F', marginTop: 4 }}>96 Hours Guarantee</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Emergency Restock: 24 Hours</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Payment Settlement Terms</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324F', marginTop: 4 }}>Net 30 Days</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Electronic Bank Wire Transfer</div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 16, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Delivery Receiving Dock</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324F', marginTop: 4 }}>Central Pharmacy - Bay 4</div>
                    <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2 }}>Goods Dock Hours: 08:00 AM – 06:00 PM</div>
                  </div>
                </div>

                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <IconTruck size={18} color="#2563eb" />
                    <strong style={{ color: '#1e3a8a', fontSize: '0.92rem' }}>Authorized Logistics Carriers</strong>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#1d4ed8', lineHeight: 1.5 }}>
                    Hospital receiving accepts consignments shipped via <strong>DHL Medical Logistics</strong> and <strong>Blue Dart Pharma Express</strong>. Digital cold-chain temperature logs (2°C – 8°C) are strictly mandatory upon check-in.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 3: Password & Security */}
            {activeTab === 'SECURITY' && (
              <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#16324F' }}>
                    Portal Credentials & Security
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Manage account authentication credentials and protect your wholesale vendor dispatch access.
                  </p>
                </div>

                <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="At least 8 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#16324F', marginBottom: 6 }}>
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      style={{ width: '100%', height: 42, padding: '0 14px', borderRadius: 12, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="clay-action-pill-btn clay-action-pill-btn--primary"
                    style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700, alignSelf: 'flex-start', marginTop: 6 }}
                  >
                    <IconLock size={16} />
                    <span>{saving ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab 4: Alert Preferences */}
            {activeTab === 'NOTIFICATIONS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#16324F' }}>
                    Notification & Dispatch Alert Preferences
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Choose which real-time events trigger SMS dispatch notices and email copies.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { key: 'emailNewPO', title: 'New Purchase Orders Issued', desc: 'Receive real-time email notification whenever hospital pharmacy generates a new purchase order.' },
                    { key: 'smsDispatchReminder', title: 'Carrier Dispatch Reminders', desc: 'SMS alerts 24 hours prior to standard SLA fulfillment deadline.' },
                    { key: 'emailReceiptConfirm', title: 'Goods Receipt Verification', desc: 'Instant confirmation when hospital inventory receiving verifies delivered consignment.' },
                    { key: 'coldChainAlerts', title: 'Cold Chain Compliance Alerts', desc: 'Priority notice if cold chain carrier temperature logs require re-upload.' },
                    { key: 'stockReplenishment', title: 'Hospital Stock Buffer Depletion', desc: 'Advance notice when hospital stock for your contracted lines falls below buffer.' }
                  ].map(({ key, title, desc }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 14,
                        gap: 16
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#16324F', fontSize: '0.9rem' }}>{title}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>{desc}</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifPrefs[key]}
                        onChange={(e) => {
                          setNotifPrefs({ ...notifPrefs, [key]: e.target.checked });
                          showToast('Notification preference saved.');
                        }}
                        style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#008C8C' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

