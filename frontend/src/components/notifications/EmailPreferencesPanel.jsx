import { useState, useEffect, useCallback } from 'react';
import { fetchEmailPreferences, updateEmailPreferences } from '../../services/api';
import { IconCheck, IconShield, IconMail, IconAlertTriangle } from '../icons/Icons';
import './EmailPreferencesPanel.css';

export default function EmailPreferencesPanel({ onToast }) {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchEmailPreferences();
      const list = res.data || res || [];
      setPreferences(Array.isArray(list) ? list : []);
      setHasChanges(false);
    } catch (err) {
      if (onToast) onToast('Failed to load email preferences: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleToggle = (category, mandatory) => {
    if (mandatory) return;
    setPreferences(prev =>
      prev.map(p => (p.category === category ? { ...p, enabled: !p.enabled } : p))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const map = {};
      preferences.forEach(p => {
        map[p.category] = p.enabled;
      });
      const res = await updateEmailPreferences(map);
      const updated = res.data || res || [];
      if (Array.isArray(updated) && updated.length > 0) {
        setPreferences(updated);
      }
      setHasChanges(false);
      if (onToast) onToast('Email notification preferences saved successfully!', 'success');
    } catch (err) {
      if (onToast) onToast('Error saving preferences: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="email-pref-loading">
        <div className="pref-spinner"></div>
        <span>Loading your email notification preferences...</span>
      </div>
    );
  }

  return (
    <div className="email-preferences-container">
      <div className="email-pref-header">
        <div>
          <h3 className="email-pref-title">
            <IconMail className="pref-icon" /> Role-Based Email Notification Preferences
          </h3>
          <p className="email-pref-subtitle">
            Configure which MediStock operational alerts and procurement updates are dispatched to your registered email address via SMTP.
          </p>
        </div>
        <button
          className="clay-btn clay-btn--primary"
          onClick={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      <div className="email-pref-policy-banner">
        <IconShield className="policy-icon" />
        <span>
          <strong>Hospital Notification Policy:</strong> Critical security alerts and emergency recall notifications are mandatory and delivered regardless of preference toggles to maintain regulatory compliance.
        </span>
      </div>

      <div className="email-pref-list">
        {preferences.map(pref => (
          <div
            key={pref.category}
            className={`email-pref-card ${pref.mandatory ? 'email-pref-card--mandatory' : ''}`}
          >
            <div className="email-pref-info">
              <div className="email-pref-name-row">
                <span className="email-pref-name">{pref.displayName}</span>
                {pref.mandatory ? (
                  <span className="pref-badge pref-badge--locked">
                    <IconShield style={{ width: 12, height: 12, marginRight: 4 }} /> Mandatory
                  </span>
                ) : pref.enabled ? (
                  <span className="pref-badge pref-badge--active">Active</span>
                ) : (
                  <span className="pref-badge pref-badge--muted">Disabled</span>
                )}
              </div>
              <p className="email-pref-desc">{pref.description}</p>
            </div>

            <div className="email-pref-toggle-wrapper">
              <label className="clay-switch">
                <input
                  type="checkbox"
                  checked={pref.enabled}
                  disabled={pref.mandatory}
                  onChange={() => handleToggle(pref.category, pref.mandatory)}
                />
                <span className="clay-slider round"></span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

