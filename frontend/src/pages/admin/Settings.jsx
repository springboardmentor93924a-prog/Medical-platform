
import React, { useEffect, useState } from "react";

const initialSettings = {
  companyName: "MediStock",
  lowStockThreshold: 10,
  expiryAlertDays: 30,
  dateFormat: "DD/MM/YYYY",
  currency: "INR",
  emailNotifications: true,
  lowStockNotifications: true,
  expiryNotifications: true,
  maintenanceMode: false,
  allowStaffStockOut: true,
  requireNotes: true,
};

const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition";

function Section({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm p-5 md:p-6 transition-colors">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">
          {label}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
            checked ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem("medistock_settings");
      return stored
        ? { ...initialSettings, ...JSON.parse(stored) }
        : initialSettings;
    } catch {
      return initialSettings;
    }
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        "medistock_settings",
        JSON.stringify(settings)
      );
      setSaved(true);
    } catch {
      setSaved(false);
      alert("Unable to save settings in this browser.");
    }
  };

  const handleReset = () => {
    setSettings({ ...initialSettings });
    localStorage.removeItem("medistock_settings");
    setSaved(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-7 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 md:p-7 mb-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl">
                ⚙
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Settings
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Manage application settings and configuration.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Reset
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Save Message */}
        {saved && (
          <div className="mb-5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-400">
            ✓ Settings saved successfully in this browser.
          </div>
        )}

        <div className="space-y-6">

          {/* General Settings */}
          <Section
            title="General Settings"
            description="Configure basic application information."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Application Name
                </label>
                <input
                  className={inputClass}
                  value={settings.companyName}
                  onChange={(e) =>
                    updateSetting("companyName", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Currency
                </label>
                <select
                  className={inputClass}
                  value={settings.currency}
                  onChange={(e) =>
                    updateSetting("currency", e.target.value)
                  }
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date Format
                </label>
                <select
                  className={inputClass}
                  value={settings.dateFormat}
                  onChange={(e) =>
                    updateSetting("dateFormat", e.target.value)
                  }
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Inventory Settings */}
          <Section
            title="Inventory Configuration"
            description="Manage stock thresholds and expiry alert rules."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={settings.lowStockThreshold}
                  onChange={(e) =>
                    updateSetting(
                      "lowStockThreshold",
                      Math.max(0, Number(e.target.value))
                    )
                  }
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alert when available stock reaches this quantity.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Expiry Alert (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={settings.expiryAlertDays}
                  onChange={(e) =>
                    updateSetting(
                      "expiryAlertDays",
                      Math.max(0, Number(e.target.value))
                    )
                  }
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Notify before a medicine batch expires.
                </p>
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section
            title="Notification Settings"
            description="Control which application alerts are enabled."
          >
            <Toggle
              label="Email Notifications"
              description="Enable application email notifications."
              checked={settings.emailNotifications}
              onChange={(value) =>
                updateSetting("emailNotifications", value)
              }
            />

            <Toggle
              label="Low Stock Alerts"
              description="Notify when inventory falls below the configured threshold."
              checked={settings.lowStockNotifications}
              onChange={(value) =>
                updateSetting("lowStockNotifications", value)
              }
            />

            <Toggle
              label="Expiry Alerts"
              description="Notify when medicine batches approach their expiry date."
              checked={settings.expiryNotifications}
              onChange={(value) =>
                updateSetting("expiryNotifications", value)
              }
            />
          </Section>

          {/* Permissions */}
          <Section
            title="Access & Permissions"
            description="Configure permitted inventory operations."
          >
            <Toggle
              label="Allow Staff Stock OUT"
              description="Allow staff users to issue stock from inventory."
              checked={settings.allowStaffStockOut}
              onChange={(value) =>
                updateSetting("allowStaffStockOut", value)
              }
            />

            <Toggle
              label="Require Notes for Stock Movements"
              description="Require a reason when recording stock IN or OUT."
              checked={settings.requireNotes}
              onChange={(value) =>
                updateSetting("requireNotes", value)
              }
            />
          </Section>

          {/* System Configuration */}
          <Section
            title="System Configuration"
            description="Manage application availability."
          >
            <Toggle
              label="Maintenance Mode"
              description="Mark the application as under maintenance. Backend enforcement is required."
              checked={settings.maintenanceMode}
              onChange={(value) =>
                updateSetting("maintenanceMode", value)
              }
            />
          </Section>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pb-5">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Reset
            </button>

            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
