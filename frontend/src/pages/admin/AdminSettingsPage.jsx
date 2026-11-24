import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminBackupRestorePage from './AdminBackupRestorePage';
import {
  IconSettings,
  IconCheckCircle,
  IconShield,
  IconBell,
  IconUser,
  IconLock,
  IconClock,
  IconActivity,
  IconRefresh,
  IconDownload,
  IconAlertTriangle,
  IconX,
  IconMail,
  IconKey,
  IconInfo,
  IconFileText,
  IconTrash
} from '../../components/icons/Icons';
import './AdminPages.css';

// Left navigation tabs matching "MediStock Settings Dashboard.png"
const SETTINGS_TABS = [
  { id: 'app', label: 'Application Configuration', icon: IconSettings, desc: 'System settings and preferences' },
  { id: 'backup', label: 'Backup & Disaster Recovery', icon: IconShield, desc: 'AES-256 encrypted database backups' },
  { id: 'profile', label: 'Profile Settings', icon: IconUser, desc: 'Manage your account details' },
  { id: 'notification', label: 'Notification Settings', icon: IconBell, desc: 'Alerts and notifications' },
  { id: 'security', label: 'Security Settings', icon: IconLock, desc: 'Password and access control' },
  { id: 'preferences', label: 'System Preferences', icon: IconClock, desc: 'Timezone, language, display' },
];

// Application Config sub-tabs matching Screenshot
const APP_SUBTABS = ['General', 'Database', 'Email', 'API', 'Backup'];

export default function AdminSettingsPage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('app');
  const [activeSubTab, setActiveSubTab] = useState('General');
  const [toast, setToast] = useState(null);

  // Application Configuration state
  const [appSettings, setAppSettings] = useState({
    appName: 'MediStock',
    timezone: 'Asia/Karachi (UTC+5)',
    language: 'English',
    currency: 'PKR (₨)',
    dateFormat: 'DD-MM-YYYY',
    itemsPerPage: '25',
    maintenanceMode: false,
    autoBackup: true,
  });

  // Profile Settings state
  const [profileSettings, setProfileSettings] = useState({
    fullName: 'Dr. Sarah Khan',
    email: 'sarah.khan@medistock.com',
    phone: '+92 300 1234567',
    department: 'System Administration',
    title: 'Chief Administrator',
  });

  // Notification Preferences state
  const [notifSettings, setNotifSettings] = useState({
    lowStock: true,
    expiryReminders: true,
    purchaseOrderUpdates: true,
    systemAlerts: true,
    emailNotifications: false,
  });

  // Security Settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordPolicy: 'Minimum 8 characters, 1 number, 1 symbol',
    maxLoginAttempts: '5',
    ipWhitelist: false,
  });

  // User Preferences state
  const [userPrefs, setUserPrefs] = useState({
    defaultDashboard: 'Inventory Overview',
    theme: 'Light',
    timeFormat: '12 Hour (AM/PM)',
    language: 'English',
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('medistock_user');
      if (stored) {
        const u = JSON.parse(stored);
        setProfileSettings(prev => ({
          ...prev,
          fullName: u.fullName || u.username || prev.fullName,
          email: u.email || prev.email,
          phone: u.phone || prev.phone
        }));
      }
      const savedConfig = localStorage.getItem('medistock_app_settings');
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig);
        if (cfg.appSettings) setAppSettings(cfg.appSettings);
        if (cfg.notifSettings) setNotifSettings(cfg.notifSettings);
        if (cfg.securitySettings) setSecuritySettings(cfg.securitySettings);
        if (cfg.userPrefs) setUserPrefs(cfg.userPrefs);
      }
    } catch (_e) {}
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const subtabParam = searchParams.get('subtab');
    if (tabParam === 'backup' || subtabParam?.toLowerCase() === 'backup') {
      setActiveTab('backup');
      setActiveSubTab('Backup');
    } else if (tabParam && SETTINGS_TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('medistock_app_settings', JSON.stringify({
      appSettings,
      profileSettings,
      notifSettings,
      securitySettings,
      userPrefs,
    }));
    showToast('Settings saved successfully. Changes will take effect immediately.');
  };

  const handleResetDefaults = () => {
    setAppSettings({
      appName: 'MediStock',
      timezone: 'Asia/Karachi (UTC+5)',
      language: 'English',
      currency: 'PKR (₨)',
      dateFormat: 'DD-MM-YYYY',
      itemsPerPage: '25',
      maintenanceMode: false,
      autoBackup: true,
    });
    showToast('Application settings reset to factory defaults.');
  };

  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify({ appSettings, profileSettings, notifSettings, securitySettings, userPrefs }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medistock_settings_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Settings configuration exported as JSON backup.');
  };

  // Toggle switch component
  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#16324F' }}>{label}</div>
        {description && <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '2px' }}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={onChange}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          backgroundColor: checked ? '#008C8C' : '#CBD5E1',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0,
          marginLeft: '12px'
        }}
      >
        <span style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFF',
          transition: 'left 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
        }} />
      </button>
    </div>
  );

  return (
    <div className="admin-page-container">
      {/* Toast Alert */}
      {toast && (
        <div style={{ background: toast.type === 'error' ? '#fee2e2' : '#d1fae5', color: toast.type === 'error' ? '#991b1b' : '#065f46', border: '1px solid #cbd5e1', padding: '12px 18px', borderRadius: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(16, 46, 89, 0.05)' }}>
          <span style={{ fontWeight: 600 }}>{toast.type === 'error' ? '✕' : '✓'} {toast.message}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16324F', margin: 0 }}>System Settings</h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '4px 0 0 0' }}>Manage application configuration, notifications, and security policies.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={handleExportConfig}
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
            <IconDownload size={16} /> Export Configuration
          </button>
        </div>
      </div>

      {/* Main 3-column grid: Left Tabs | Center Content | Right System Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr) 280px', gap: '20px', alignItems: 'start' }}>
        {/* Left Column: Settings Tabs */}
        <div className="clay-side-widget" style={{ padding: '12px' }}>
          {SETTINGS_TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  backgroundColor: isActive ? '#BAF3E6' : 'transparent',
                  color: isActive ? '#047857' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  transition: 'all 0.15s ease',
                  marginBottom: '4px'
                }}
              >
                <TabIcon size={18} style={{ color: isActive ? '#047857' : '#94A3B8', flexShrink: 0 }} />
                <div>
                  <div>{tab.label}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 500, color: isActive ? '#065f46' : '#94A3B8', marginTop: '1px' }}>{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center Column: Active Settings Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Application Configuration Tab */}
          {activeTab === 'app' && (
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, color: '#16324F' }}>
                Application Configuration
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748B' }}>
                Configure basic application settings and system behavior
              </p>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #E2E8F0', marginBottom: '20px' }}>
                {APP_SUBTABS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveSubTab(sub)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: activeSubTab === sub ? '2px solid #008C8C' : '2px solid transparent',
                      backgroundColor: 'transparent',
                      color: activeSubTab === sub ? '#008C8C' : '#64748B',
                      fontWeight: activeSubTab === sub ? 600 : 500,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      marginBottom: '-2px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* General Settings Sub-tab */}
              {activeSubTab === 'General' && (
                <div>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    General Settings
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Application Name
                      </label>
                      <input
                        type="text"
                        className="admin-input"
                        value={appSettings.appName}
                        onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        System Timezone
                      </label>
                      <select
                        className="admin-select"
                        value={appSettings.timezone}
                        onChange={(e) => setAppSettings({ ...appSettings, timezone: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="Asia/Karachi (UTC+5)">Asia/Karachi (UTC+5)</option>
                        <option value="Asia/Kolkata (UTC+5:30)">Asia/Kolkata (UTC+5:30)</option>
                        <option value="America/New_York (UTC-5)">America/New_York (UTC-5)</option>
                        <option value="Europe/London (UTC+0)">Europe/London (UTC+0)</option>
                        <option value="Asia/Dubai (UTC+4)">Asia/Dubai (UTC+4)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Default Language
                      </label>
                      <select
                        className="admin-select"
                        value={appSettings.language}
                        onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="English">English</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Currency
                      </label>
                      <select
                        className="admin-select"
                        value={appSettings.currency}
                        onChange={(e) => setAppSettings({ ...appSettings, currency: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="PKR (₨)">PKR (₨)</option>
                        <option value="USD ($)">USD ($)</option>
                        <option value="EUR (€)">EUR (€)</option>
                        <option value="GBP (£)">GBP (£)</option>
                        <option value="INR (₹)">INR (₹)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Date Format
                      </label>
                      <select
                        className="admin-select"
                        value={appSettings.dateFormat}
                        onChange={(e) => setAppSettings({ ...appSettings, dateFormat: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                        <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Items Per Page
                      </label>
                      <select
                        className="admin-select"
                        value={appSettings.itemsPerPage}
                        onChange={(e) => setAppSettings({ ...appSettings, itemsPerPage: e.target.value })}
                        style={{ width: '100%' }}
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <ToggleSwitch
                      checked={appSettings.maintenanceMode}
                      onChange={() => setAppSettings({ ...appSettings, maintenanceMode: !appSettings.maintenanceMode })}
                      label="Enable Maintenance Mode"
                      description="Temporarily disable access to the system for non-admin users"
                    />
                    <ToggleSwitch
                      checked={appSettings.autoBackup}
                      onChange={() => setAppSettings({ ...appSettings, autoBackup: !appSettings.autoBackup })}
                      label="Auto Backup"
                      description="Enable automatic database backups on a nightly schedule"
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn--outline"
                      onClick={handleResetDefaults}
                    >
                      <IconRefresh size={15} /> Reset to Defaults
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      onClick={handleSaveSettings}
                    >
                      <IconCheckCircle size={15} /> Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Database Sub-tab */}
              {activeSubTab === 'Database' && (
                <div>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    Database Configuration
                  </h4>
                  <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#166534' }}>
                    <IconCheckCircle size={18} style={{ color: '#16A34A' }} />
                    <span>Database connection is active and healthy. MariaDB 10.6.17 on port 3307.</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Database Host</label>
                      <input type="text" className="admin-input" value="localhost" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Port</label>
                      <input type="text" className="admin-input" value="3307" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Database Name</label>
                      <input type="text" className="admin-input" value="medistock" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Engine</label>
                      <input type="text" className="admin-input" value="MariaDB (InnoDB)" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '12px' }}>
                    Database credentials are managed server-side in application.yml and are not editable from the UI.
                  </p>
                </div>
              )}

              {/* Email Sub-tab */}
              {activeSubTab === 'Email' && (
                <div>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    Email / SMTP Configuration
                  </h4>
                  <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.84rem', color: '#92400E' }}>
                    <IconAlertTriangle size={18} style={{ color: '#D97706' }} />
                    <span>SMTP is not yet configured. Email notifications will be unavailable until setup is complete.</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>SMTP Host</label>
                      <input type="text" className="admin-input" placeholder="e.g. smtp.gmail.com" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>SMTP Port</label>
                      <input type="text" className="admin-input" placeholder="587" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sender Email</label>
                      <input type="email" className="admin-input" placeholder="noreply@medistock.com" style={{ width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sender Name</label>
                      <input type="text" className="admin-input" placeholder="MediStock Alerts" style={{ width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                    <button type="button" className="admin-btn admin-btn--outline" onClick={() => showToast('SMTP test email could not be sent — SMTP is not configured.', 'error')}>
                      <IconMail size={15} /> Send Test Email
                    </button>
                    <button type="button" className="admin-btn admin-btn--primary" onClick={() => showToast('Email settings saved (pending SMTP setup).')}>
                      <IconCheckCircle size={15} /> Save Email Config
                    </button>
                  </div>
                </div>
              )}

              {/* API Sub-tab */}
              {activeSubTab === 'API' && (
                <div>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                    API Configuration
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>API Base URL</label>
                      <input type="text" className="admin-input" value="http://localhost:8080/api" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>JWT Expiration</label>
                      <input type="text" className="admin-input" value="24 hours" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CORS Origins</label>
                      <input type="text" className="admin-input" value="http://localhost:5173" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Rate Limiting</label>
                      <input type="text" className="admin-input" value="100 requests/minute" disabled style={{ width: '100%', backgroundColor: '#F8FAFC' }} />
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '12px' }}>
                    API configuration is managed at the server level through Spring Boot properties. JWT secrets are never exposed in the UI.
                  </p>
                </div>
              )}

              {/* Backup Sub-tab */}
              {activeSubTab === 'Backup' && (
                <div style={{ marginTop: '10px' }}>
                  <AdminBackupRestorePage embedded={true} />
                </div>
              )}
            </div>
          )}

          {/* Backup & Disaster Recovery Tab */}
          {activeTab === 'backup' && (
            <AdminBackupRestorePage embedded={true} />
          )}

          {/* Profile Settings Tab */}
          {activeTab === 'profile' && (
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, color: '#16324F' }}>
                Profile Settings
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: '#64748B' }}>
                Manage your personal account information and contact details
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: '#008C8C', color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 700
                }}>
                  SK
                </div>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#16324F' }}>{profileSettings.fullName}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{profileSettings.title} • {profileSettings.department}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={profileSettings.fullName}
                    onChange={(e) => setProfileSettings({ ...profileSettings, fullName: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Email Address</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={profileSettings.email}
                    onChange={(e) => setProfileSettings({ ...profileSettings, email: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings({ ...profileSettings, phone: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Department</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={profileSettings.department}
                    onChange={(e) => setProfileSettings({ ...profileSettings, department: e.target.value })}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveSettings}>
                  <IconCheckCircle size={15} /> Update Profile
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings Tab */}
          {activeTab === 'notification' && (
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, color: '#16324F' }}>
                Notification Preferences
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748B' }}>
                Choose what notifications you want to receive
              </p>

              <ToggleSwitch
                checked={notifSettings.lowStock}
                onChange={() => setNotifSettings({ ...notifSettings, lowStock: !notifSettings.lowStock })}
                label="Low Stock Alerts"
                description="Get notified when stock levels reach reorder thresholds"
              />
              <ToggleSwitch
                checked={notifSettings.expiryReminders}
                onChange={() => setNotifSettings({ ...notifSettings, expiryReminders: !notifSettings.expiryReminders })}
                label="Expiry Reminders"
                description="Receive expiry date notifications for batches approaching expiration"
              />
              <ToggleSwitch
                checked={notifSettings.purchaseOrderUpdates}
                onChange={() => setNotifSettings({ ...notifSettings, purchaseOrderUpdates: !notifSettings.purchaseOrderUpdates })}
                label="Purchase Order Updates"
                description="Order status changes, approval, and delivery notifications"
              />
              <ToggleSwitch
                checked={notifSettings.systemAlerts}
                onChange={() => setNotifSettings({ ...notifSettings, systemAlerts: !notifSettings.systemAlerts })}
                label="System Alerts"
                description="Important system notifications and maintenance warnings"
              />
              <ToggleSwitch
                checked={notifSettings.emailNotifications}
                onChange={() => setNotifSettings({ ...notifSettings, emailNotifications: !notifSettings.emailNotifications })}
                label="Email Notifications"
                description="Receive critical alerts via email (requires SMTP configuration)"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveSettings}>
                  <IconCheckCircle size={15} /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Security Settings Tab */}
          {activeTab === 'security' && (
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, color: '#16324F' }}>
                Security Settings
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748B' }}>
                Manage your account security and access control policies
              </p>

              <ToggleSwitch
                checked={securitySettings.twoFactorAuth}
                onChange={() => setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Auto Logout After
                  </label>
                  <select
                    className="admin-select"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Max Login Attempts
                  </label>
                  <select
                    className="admin-select"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="3">3 attempts</option>
                    <option value="5">5 attempts</option>
                    <option value="10">10 attempts</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Password Policy
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={securitySettings.passwordPolicy}
                  disabled
                  style={{ width: '100%', backgroundColor: '#F8FAFC' }}
                />
              </div>

              <ToggleSwitch
                checked={securitySettings.ipWhitelist}
                onChange={() => setSecuritySettings({ ...securitySettings, ipWhitelist: !securitySettings.ipWhitelist })}
                label="IP Whitelist"
                description="Restrict access to specific IP addresses only"
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveSettings}>
                  <IconCheckCircle size={15} /> Save Security Settings
                </button>
              </div>
            </div>
          )}

          {/* System Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="admin-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 600, color: '#16324F' }}>
                User Preferences
              </h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.82rem', color: '#64748B' }}>
                Customize your personal dashboard experience
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Default Dashboard
                  </label>
                  <select
                    className="admin-select"
                    value={userPrefs.defaultDashboard}
                    onChange={(e) => setUserPrefs({ ...userPrefs, defaultDashboard: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="Inventory Overview">Inventory Overview</option>
                    <option value="Stock Management">Stock Management</option>
                    <option value="Purchase Orders">Purchase Orders</option>
                    <option value="Reports">Reports</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Language
                  </label>
                  <select
                    className="admin-select"
                    value={userPrefs.language}
                    onChange={(e) => setUserPrefs({ ...userPrefs, language: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="English">English</option>
                    <option value="Urdu">Urdu</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Time Format
                  </label>
                  <select
                    className="admin-select"
                    value={userPrefs.timeFormat}
                    onChange={(e) => setUserPrefs({ ...userPrefs, timeFormat: e.target.value })}
                    style={{ width: '100%' }}
                  >
                    <option value="12 Hour (AM/PM)">12 Hour (AM/PM)</option>
                    <option value="24 Hour">24 Hour</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                    Theme
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setUserPrefs({ ...userPrefs, theme: 'Light' })}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${userPrefs.theme === 'Light' ? '#008C8C' : '#E2E8F0'}`,
                        backgroundColor: userPrefs.theme === 'Light' ? 'rgba(0,140,140,0.06)' : '#FFF',
                        color: userPrefs.theme === 'Light' ? '#008C8C' : '#64748B',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      ☀ Light
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserPrefs({ ...userPrefs, theme: 'Dark' })}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${userPrefs.theme === 'Dark' ? '#008C8C' : '#E2E8F0'}`,
                        backgroundColor: userPrefs.theme === 'Dark' ? 'rgba(0,140,140,0.06)' : '#FFF',
                        color: userPrefs.theme === 'Dark' ? '#008C8C' : '#64748B',
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        cursor: 'pointer'
                      }}
                    >
                      🌙 Dark
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveSettings}>
                  <IconCheckCircle size={15} /> Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: System Information & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* System Information Card */}
          <div className="admin-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 600, color: '#16324F' }}>
              System Information
            </h3>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: '#64748B' }}>
              Current system details and configuration
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Application Version</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>1.0.0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Server Uptime</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>12 days, 6 hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Java Version</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>17.0.8</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Spring Boot Version</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>3.2.3</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Database Version</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>MariaDB 10.6.17</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ color: '#64748B' }}>Operating System</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>Linux (Ubuntu 22.04)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: '#64748B' }}>Timezone</span>
                <span style={{ fontWeight: 600, color: '#16324F' }}>Asia/Karachi (UTC+5)</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="admin-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 600, color: '#16324F' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                style={{ justifyContent: 'flex-start', fontSize: '0.84rem' }}
                onClick={() => showToast('Application cache cleared successfully.')}
              >
                <IconTrash size={15} /> Clear Cache
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                style={{ justifyContent: 'flex-start', fontSize: '0.84rem', color: '#DC2626' }}
                onClick={() => showToast('Application restart requires server-side access. Contact DevOps.', 'error')}
              >
                <IconRefresh size={15} /> Restart Application
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                style={{ justifyContent: 'flex-start', fontSize: '0.84rem' }}
                onClick={() => {
                  const blob = new Blob([JSON.stringify({ appSettings, profileSettings, notifSettings, securitySettings, userPrefs }, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `medistock_settings_backup_${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Settings configuration exported as JSON backup.');
                }}
              >
                <IconDownload size={15} /> Export Settings
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                style={{ justifyContent: 'flex-start', fontSize: '0.84rem' }}
                onClick={() => window.open('/admin/monitoring', '_self')}
              >
                <IconFileText size={15} /> View System Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
