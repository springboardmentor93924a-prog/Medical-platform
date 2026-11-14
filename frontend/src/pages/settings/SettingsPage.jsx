import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  Building2, 
  ShieldCheck, 
  Bell, 
  Database, 
  Save, 
  RotateCcw,
  CheckCircle2, 
  Lock, 
  Clock, 
  AlertCircle
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';

export const SettingsPage = () => {
  const { showToast } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();

  // Settings State initialized from localStorage or defaults
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('medistock_app_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      facilityName: 'City Central Healthcare Network',
      supportEmail: 'support@medistock.com',
      currency: 'USD ($)',
      lowStockThreshold: 20,
      expiryWarningDays: 60,
      sessionTimeoutMinutes: 60,
      requireTwoFactor: false,
      notifyEmailLowStock: true,
      notifyEmailExpiry: true,
      notifyInAppToasts: true,
      autoStockDeduction: true
    };
  });

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'security', 'notifications', 'system'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'general' ? {} : { tab: tabId });
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('medistock_app_settings', JSON.stringify(settings));
      setTimeout(() => {
        setIsSaving(false);
        showToast('success', 'Application settings successfully updated and saved');
      }, 500);
    } catch (err) {
      setIsSaving(false);
      showToast('error', 'Failed to save application settings');
    }
  };

  const handleReset = () => {
    const defaults = {
      facilityName: 'City Central Healthcare Network',
      supportEmail: 'support@medistock.com',
      currency: 'USD ($)',
      lowStockThreshold: 20,
      expiryWarningDays: 60,
      sessionTimeoutMinutes: 60,
      requireTwoFactor: false,
      notifyEmailLowStock: true,
      notifyEmailExpiry: true,
      notifyInAppToasts: true,
      autoStockDeduction: true
    };
    setSettings(defaults);
    localStorage.setItem('medistock_app_settings', JSON.stringify(defaults));
    showToast('info', 'Settings restored to system factory defaults');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-emerald-600" />
            System Settings & Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure global inventory thresholds, compliance policies, in-app notification rules, and facility defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RotateCcw} onClick={handleReset}>
            Reset Defaults
          </Button>
          <Button variant="primary" icon={Save} isLoading={isSaving} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6 rounded-t-2xl gap-6 overflow-x-auto">
        {[
          { id: 'general', label: 'Facility & Inventory', icon: Building2 },
          { id: 'security', label: 'Security & Auth', icon: ShieldCheck },
          { id: 'notifications', label: 'Alert Preferences', icon: Bell },
          { id: 'system', label: 'System Information', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 py-4 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-b-2xl border border-t-0 border-slate-200/80 p-6">
        {activeTab === 'general' && (
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Healthcare Facility Name</label>
                <input
                  type="text"
                  value={settings.facilityName}
                  onChange={(e) => handleChange('facilityName', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Support Contact Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Default Minimum Stock Reorder Level</label>
                <input
                  type="number"
                  min="1"
                  value={settings.lowStockThreshold}
                  onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Advance Expiry Warning Window (Days)</label>
                <input
                  type="number"
                  min="7"
                  max="365"
                  value={settings.expiryWarningDays}
                  onChange={(e) => handleChange('expiryWarningDays', parseInt(e.target.value) || 30)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" icon={Save} isLoading={isSaving}>
                Save Facility Configuration
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">Authentication & Session Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Enforce Multi-Factor Authentication (MFA)</h3>
                  <p className="text-xs text-slate-500">Require one-time verification passcodes for privileged administrative logins</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.requireTwoFactor}
                  onChange={(e) => handleChange('requireTwoFactor', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Inactivity Session Timeout</h3>
                  <p className="text-xs text-slate-500">Automatically invalidate inactive JWT access tokens</p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {settings.sessionTimeoutMinutes} Minutes
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">In-App Alert Routing & Threshold Rules</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Low Stock In-App Alerts</h3>
                  <p className="text-xs text-slate-500">Generate real-time system alerts when medicine inventory drops below reorder point</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyEmailLowStock}
                  onChange={(e) => handleChange('notifyEmailLowStock', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Advance Expiry Warnings & Hazard Alerts</h3>
                  <p className="text-xs text-slate-500">Trigger daily scheduled audits and in-app alerts for nearing and expired medicines</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyEmailExpiry}
                  onChange={(e) => handleChange('notifyEmailExpiry', e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-base font-bold text-slate-900 border-b pb-2">Platform Health & Environment Metadata</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Application Version</span>
                <p className="text-base font-bold text-slate-900 mt-1">MediStock Platform v1.0.0</p>
                <span className="text-xs text-emerald-600 font-medium">Production Release Build</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Backend Framework</span>
                <p className="text-base font-bold text-slate-900 mt-1">Java 21 LTS + Spring Boot 3.3.5</p>
                <span className="text-xs text-slate-500">Hibernate ORM + Spring Security</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Frontend Runtime</span>
                <p className="text-base font-bold text-slate-900 mt-1">React 18 + Vite 5 + Tailwind CSS</p>
                <span className="text-xs text-slate-500">Pure JavaScript Single-Page Application</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 font-semibold uppercase">Database Profile</span>
                <p className="text-base font-bold text-slate-900 mt-1">MySQL / MariaDB</p>
                <span className="text-xs text-emerald-600">Active HikariCP Connection Pool</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
