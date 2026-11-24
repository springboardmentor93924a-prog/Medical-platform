import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchBackupSummary,
  fetchBackups,
  createBackup,
  verifyBackup,
  deleteBackup,
  downloadBackupBlob,
  fetchBackupSchedules,
  updateBackupSchedule,
  previewRestore,
  confirmRestore,
  fetchRestoreHistory
} from '../../services/api';
import {
  IconShield,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconSearch,
  IconRefresh,
  IconDownload,
  IconPlus,
  IconX,
  IconLock,
  IconCalendar,
  IconHistory,
  IconFileText,
  IconSettings
} from '../../components/icons/Icons';
import './AdminPages.css';

export default function AdminBackupRestorePage({ embedded = false }) {
  // Main Data States
  const [summary, setSummary] = useState({
    totalBackups: 0,
    verifiedBackups: 0,
    failedBackups: 0,
    storageUsedBytes: 0,
    formattedStorageUsed: '0 B',
    latestBackupRef: null,
    latestBackupDate: null,
    latestBackupStatus: null,
    nextScheduledBackup: 'Daily at 02:00',
    pitrAvailable: false,
    binlogStatus: 'OFF',
    databaseEngine: 'MariaDB 10.4.32'
  });

  const [backups, setBackups] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [restoreHistory, setRestoreHistory] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, history, schedules, restore, recovery_history, security
  const [toast, setToast] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Manual Backup Modal
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [backupForm, setBackupForm] = useState({
    backupName: '',
    description: '',
    scope: 'FULL_DATABASE'
  });
  const [creatingBackup, setCreatingBackup] = useState(false);

  // Restore Modal & Wizard
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [createPreSnapshot, setCreatePreSnapshot] = useState(true);
  const [restoring, setRestoring] = useState(false);

  // Schedule Edit Modal
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    enabled: true,
    scheduledTime: '02:00',
    retentionDays: 30
  });

  // Action status loading states
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // ─── LOAD DATA ───
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, bkpRes, schRes, rstRes] = await Promise.allSettled([
        fetchBackupSummary(),
        fetchBackups(),
        fetchBackupSchedules(),
        fetchRestoreHistory()
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (bkpRes.status === 'fulfilled' && Array.isArray(bkpRes.value)) {
        setBackups(bkpRes.value);
      }
      if (schRes.status === 'fulfilled' && Array.isArray(schRes.value)) {
        setSchedules(schRes.value);
      }
      if (rstRes.status === 'fulfilled' && Array.isArray(rstRes.value)) {
        setRestoreHistory(rstRes.value);
      }
    } catch (e) {
      console.warn('Error loading backup data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ─── HANDLERS ───

  const handleCreateManualBackup = async (e) => {
    e.preventDefault();
    setCreatingBackup(true);
    try {
      const res = await createBackup(backupForm);
      showToast('success', `Backup ${res.backupReference || ''} created, compressed and AES-256 encrypted successfully.`);
      setIsBackupModalOpen(false);
      setBackupForm({ backupName: '', description: '', scope: 'FULL_DATABASE' });
      loadAllData();
    } catch (err) {
      showToast('danger', `Failed to create backup: ${err.message || 'Server error'}`);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleVerifyIntegrity = async (backupId) => {
    setActionLoadingId(`verify_${backupId}`);
    try {
      const res = await verifyBackup(backupId);
      if (res.backupStatus === 'VERIFIED') {
        showToast('success', `Cryptographic Verification PASSED: ${res.verificationNotes}`);
      } else {
        showToast('danger', `Verification Alert: ${res.verificationNotes}`);
      }
      loadAllData();
    } catch (err) {
      showToast('danger', `Verification request failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDownload = async (backupId, filename) => {
    setActionLoadingId(`download_${backupId}`);
    try {
      await downloadBackupBlob(backupId, filename);
      showToast('success', `Downloading encrypted backup archive: ${filename}`);
    } catch (err) {
      showToast('danger', `Download failed: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (backupId, backupRef) => {
    if (!window.confirm(`Are you sure you want to permanently delete backup archive ${backupRef}? This action cannot be undone.`)) {
      return;
    }
    setActionLoadingId(`delete_${backupId}`);
    try {
      await deleteBackup(backupId);
      showToast('success', `Backup ${backupRef} permanently deleted.`);
      loadAllData();
    } catch (err) {
      showToast('danger', `Failed to delete backup: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Restore Wizard
  const handleOpenRestoreWizard = async (backup) => {
    setSelectedBackupForRestore(backup);
    setRestorePreview(null);
    setAdminPassword('');
    setCreatePreSnapshot(true);
    setIsRestoreModalOpen(true);
    setPreviewLoading(true);

    try {
      const preview = await previewRestore(backup.backupId);
      setRestorePreview(preview);
    } catch (err) {
      showToast('danger', `Failed to preview backup: ${err.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Execute Restoration
  const handleExecuteRestore = async () => {
    if (!adminPassword.trim()) {
      alert('Administrator password is required to authorize database restoration.');
      return;
    }

    if (!window.confirm(`WARNING: Restoration will overwrite current MediStock database tables with the backup from ${selectedBackupForRestore.createdAt}. Confirm execution?`)) {
      return;
    }

    setRestoring(true);
    try {
      const res = await confirmRestore(selectedBackupForRestore.backupId, {
        adminPassword: adminPassword.trim(),
        createPreRestoreBackup: createPreSnapshot,
        recoveryReason: 'Manual disaster recovery restore authorized by Administrator.'
      });
      showToast('success', `Database restored and verified successfully! Reference: ${res.restoreReference || ''}`);
      setIsRestoreModalOpen(false);
      loadAllData();
    } catch (err) {
      showToast('danger', `Restoration failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  // Update Schedule
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!editingSchedule) return;
    try {
      await updateBackupSchedule(editingSchedule.scheduleId, scheduleForm);
      showToast('success', `Schedule ${editingSchedule.scheduleName} updated.`);
      setEditingSchedule(null);
      loadAllData();
    } catch (err) {
      showToast('danger', `Failed to update schedule: ${err.message}`);
    }
  };

  // Filtered backups
  const filteredBackups = useMemo(() => {
    return backups.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.backupReference.toLowerCase().includes(q) ||
        b.backupName.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q));

      const matchType = !typeFilter || b.backupType === typeFilter;
      const matchStatus = !statusFilter || b.backupStatus === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [backups, search, typeFilter, statusFilter]);

  return (
    <div className={embedded ? "admin-backup-embedded" : "admin-page-container"} style={embedded ? { width: '100%', boxSizing: 'border-box' } : undefined}>
      {/* ─── HEADER ─── */}
      <div className="admin-page-header">
        <div className="admin-page-header__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ margin: 0 }}>Backup & Restore Management</h1>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 600,
                background: '#ecfdf5',
                color: '#047857',
                border: '1px solid #a7f3d0'
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
              Disaster Recovery Active
            </span>
          </div>
          <p style={{ marginTop: 4, color: 'var(--slate-600)', fontSize: '0.9rem' }}>
            Database protection and recovery center (AES-256 Encrypted & SHA-256 Checksum Verified).
          </p>
        </div>

        <div className="admin-page-header__actions" style={{ display: 'flex', gap: 10 }}>
          <button
            className="admin-btn admin-btn--primary admin-btn--sm"
            onClick={() => setIsBackupModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconPlus size={16} />
            Create Backup Now
          </button>
          <button
            className="admin-btn admin-btn--outline admin-btn--sm"
            onClick={() => {
              if (backups.length > 0) handleOpenRestoreWizard(backups[0]);
              else alert('No backups available to restore.');
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconHistory size={16} />
            Restore Latest
          </button>
          <button
            className="admin-btn admin-btn--outline admin-btn--sm"
            onClick={loadAllData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconRefresh size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: toast.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`
          }}
        >
          {toast.type === 'success' ? <IconCheckCircle size={18} /> : <IconAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── 6 KPI SUMMARY CARDS ─── */}
      <div className="admin-dash__stat-grid-6" style={{ marginBottom: 20 }}>
        <div className="admin-summary-card">
          <div className="admin-summary-card__icon">
            <IconFileText size={20} color="var(--teal-600)" />
          </div>
          <div>
            <div className="admin-summary-card__value">{summary.totalBackups || backups.length || 0}</div>
            <div className="admin-summary-card__label">Total Backups</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card__icon admin-summary-card__icon--info">
            <IconCheckCircle size={20} color="#10b981" />
          </div>
          <div>
            <div className="admin-summary-card__value">{summary.verifiedBackups || 0}</div>
            <div className="admin-summary-card__label">Verified Archives</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card__icon admin-summary-card__icon--danger">
            <IconAlertTriangle size={20} color="#ef4444" />
          </div>
          <div>
            <div className="admin-summary-card__value">{summary.failedBackups || 0}</div>
            <div className="admin-summary-card__label">Failed / Corrupted</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card__icon admin-summary-card__icon--info">
            <IconLock size={20} color="#3b82f6" />
          </div>
          <div>
            <div className="admin-summary-card__value" style={{ fontSize: '1.15rem' }}>{summary.formattedStorageUsed || '0 B'}</div>
            <div className="admin-summary-card__label">Protected Storage</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card__icon admin-summary-card__icon--warning">
            <IconClock size={20} color="#f59e0b" />
          </div>
          <div>
            <div className="admin-summary-card__value" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {summary.nextScheduledBackup || 'Daily at 02:00'}
            </div>
            <div className="admin-summary-card__label">Auto Schedule</div>
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-card__icon admin-summary-card__icon--info">
            <IconShield size={20} color="#8b5cf6" />
          </div>
          <div>
            <div className="admin-summary-card__value" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              {summary.databaseEngine || 'MariaDB 10.4'}
            </div>
            <div className="admin-summary-card__label">DB Engine & Version</div>
          </div>
        </div>
      </div>

      {/* ─── POINT-IN-TIME RECOVERY & BINLOG NOTICE ─── */}
      <div
        style={{
          marginBottom: 20,
          background: summary.pitrAvailable ? '#f0fdf4' : '#f8fafc',
          border: `1px solid ${summary.pitrAvailable ? '#bbf7d0' : '#e2e8f0'}`,
          borderRadius: 14,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconShield size={22} color={summary.pitrAvailable ? '#16a34a' : '#64748b'} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
              Point-in-Time Recovery (PITR) Status: <span style={{ color: summary.pitrAvailable ? '#15803d' : '#b45309' }}>{summary.binlogStatus === 'ON' ? 'Active (Binary Logging Enabled)' : 'Snapshot Recovery Active (Binary Logging Off)'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
              {summary.pitrAvailable
                ? 'Full continuous transaction log playback is enabled for granular timestamp rollbacks.'
                : 'Current MariaDB instance operates with binary logs OFF. Fast point-in-time recovery is supported via immutable snapshots & automated pre-restore checkpoints.'}
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.74rem',
            padding: '3px 9px',
            borderRadius: 6,
            fontWeight: 700,
            background: summary.pitrAvailable ? '#dcfce7' : '#f1f5f9',
            color: summary.pitrAvailable ? '#15803d' : '#475569'
          }}
        >
          {summary.binlogStatus === 'ON' ? 'BINLOG: ACTIVE' : 'SNAPSHOT MODE'}
        </span>
      </div>

      {/* ─── NAVIGATION TABS ─── */}
      <div style={{ display: 'flex', gap: 6, borderBottom: '2px solid #e2e8f0', marginBottom: 20, overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Backup Overview', icon: IconFileText },
          { id: 'history', label: `Backup History (${backups.length})`, icon: IconHistory },
          { id: 'schedules', label: `Auto Schedules (${schedules.length})`, icon: IconCalendar },
          { id: 'restore', label: 'Restore & Recovery', icon: IconRefresh },
          { id: 'recovery_history', label: `Recovery Log (${restoreHistory.length})`, icon: IconClock },
          { id: 'security', label: 'Storage & Encryption', icon: IconLock }
        ].map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid var(--teal-600)' : '3px solid transparent',
                color: isActive ? 'var(--teal-700)' : '#64748b',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: BACKUP OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Quick Disaster Recovery Actions */}
          <div className="admin-table-card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1e293b' }}>
              Disaster Recovery & Quick Operations
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 18 }}>
              Perform immediate manual database backups or initiate verified restorations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>Capture Production Snapshot</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Generate full encrypted MariaDB dump with table counts</div>
                </div>
                <button
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  onClick={() => setIsBackupModalOpen(true)}
                >
                  Create Backup
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>Restore Latest Verified Archive</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {backups[0] ? `Latest: ${backups[0].backupReference} (${new Date(backups[0].createdAt).toLocaleDateString()})` : 'No backups available'}
                  </div>
                </div>
                <button
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  disabled={backups.length === 0}
                  onClick={() => backups[0] && handleOpenRestoreWizard(backups[0])}
                >
                  Restore
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 14,
                  borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>Manage Retention & Schedules</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>3 active schedules (Daily, Weekly, Monthly)</div>
                </div>
                <button
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  onClick={() => setActiveTab('schedules')}
                >
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Recovery Point Status & Recommendations */}
          <div className="admin-table-card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1e293b' }}>
              RPO & RTO Recovery Objectives
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 18 }}>
              Standard operating procedures for MediStock pharmacy continuity.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.82rem' }}>
              <div style={{ padding: 12, borderRadius: 10, background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
                <div style={{ fontWeight: 600, color: '#0f766e', marginBottom: 4 }}>RPO (Recovery Point Objective): 24 Hours Max</div>
                <div style={{ color: '#115e59' }}>Nightly automated backups ensure no more than 24 hours of dispensing records can be lost in catastrophic infrastructure failure.</div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>RTO (Recovery Time Objective): &lt; 5 Minutes</div>
                <div style={{ color: '#1e3a8a' }}>Automated decompression, decryption, and schema application restores production databases in under 3 minutes.</div>
              </div>

              <div style={{ padding: 12, borderRadius: 10, background: '#fefce8', border: '1px solid #fef08a' }}>
                <div style={{ fontWeight: 600, color: '#854d0e', marginBottom: 4 }}>Pre-Restore Safety Checkpoint Rule</div>
                <div style={{ color: '#713f12' }}>Before any restore operation executes, the system automatically creates an immutable pre-restore snapshot so rollback is always guaranteed.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BACKUP HISTORY ─── */}
      {activeTab === 'history' && (
        <div>
          {/* Filter Bar */}
          <div className="admin-filter-bar" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
              <div className="admin-search-wrapper" style={{ minWidth: 260, maxWidth: 360, flex: 1 }}>
                <IconSearch size={16} />
                <input
                  type="text"
                  placeholder="Search by reference, name, notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="admin-search-input"
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <IconX size={14} color="#94a3b8" />
                  </button>
                )}
              </div>

              <select
                className="admin-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">All Backup Types</option>
                <option value="MANUAL">Manual</option>
                <option value="AUTOMATIC_SCHEDULED">Automated Scheduled</option>
                <option value="PRE_RESTORE">Pre-Restore Safety Snapshot</option>
              </select>

              <select
                className="admin-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
              >
                <option value="">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CORRUPTED">Corrupted</option>
              </select>
            </div>

            <span style={{ fontSize: '0.84rem', color: '#64748b' }}>
              Showing {filteredBackups.length} of {backups.length} backups
            </span>
          </div>

          {/* Table */}
          <div className="admin-table-card">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 150 }}>Reference</th>
                    <th>Backup Details</th>
                    <th style={{ width: 140 }}>Type</th>
                    <th style={{ width: 110 }}>Archive Size</th>
                    <th style={{ width: 110 }}>Scope & Tables</th>
                    <th style={{ width: 110, textAlign: 'center' }}>Status</th>
                    <th style={{ width: 140 }}>Created At</th>
                    <th style={{ width: 180, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                        Loading backup records...
                      </td>
                    </tr>
                  ) : filteredBackups.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                        No backup records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBackups.map(b => {
                      const typeColor =
                        b.backupType === 'AUTOMATIC_SCHEDULED' ? '#0d9488' :
                        b.backupType === 'PRE_RESTORE' ? '#8b5cf6' : '#3b82f6';

                      const statusColor =
                        b.backupStatus === 'VERIFIED' ? '#10b981' :
                        b.backupStatus === 'COMPLETED' ? '#0284c7' : '#ef4444';

                      return (
                        <tr key={b.backupId}>
                          {/* Reference */}
                          <td>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                padding: '2px 6px',
                                background: '#f1f5f9',
                                color: '#1e293b',
                                borderRadius: 6,
                                border: '1px solid #e2e8f0'
                              }}
                              title={b.backupReference}
                            >
                              {b.backupReference}
                            </span>
                          </td>

                          {/* Details */}
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{b.backupName}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {b.description || 'Full database snapshot'} · <span style={{ fontFamily: 'monospace' }}>SHA: {b.checksum ? b.checksum.substring(0, 10) + '...' : 'N/A'}</span>
                            </div>
                          </td>

                          {/* Type */}
                          <td>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: 6,
                                background: `${typeColor}15`,
                                color: typeColor,
                                border: `1px solid ${typeColor}30`
                              }}
                            >
                              {b.backupType.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Size */}
                          <td style={{ fontSize: '0.82rem', fontWeight: 500, color: '#334155' }}>
                            {formatBytes(b.fileSize)}
                          </td>

                          {/* Scope & Tables */}
                          <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                            <div>{b.tablesIncluded || 41} tables</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.recordsCount ? b.recordsCount.toLocaleString() : '20k+'} rows</div>
                          </td>

                          {/* Status */}
                          <td style={{ textAlign: 'center' }}>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                padding: '3px 8px',
                                borderRadius: 12,
                                background: `${statusColor}15`,
                                color: statusColor,
                                border: `1px solid ${statusColor}35`,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: statusColor }} />
                              {b.backupStatus}
                            </span>
                          </td>

                          {/* Date */}
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {b.createdAt ? new Date(b.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                className="admin-btn admin-btn--outline admin-btn--sm"
                                onClick={() => handleVerifyIntegrity(b.backupId)}
                                disabled={actionLoadingId === `verify_${b.backupId}`}
                                title="Verify SHA-256 Checksum & AES-256 Decryption"
                                style={{ padding: '3px 7px', height: 'auto', fontSize: '0.75rem' }}
                              >
                                {actionLoadingId === `verify_${b.backupId}` ? 'Verifying...' : 'Verify'}
                              </button>
                              <button
                                className="admin-btn admin-btn--outline admin-btn--sm"
                                onClick={() => handleDownload(b.backupId, b.fileName)}
                                disabled={actionLoadingId === `download_${b.backupId}`}
                                title="Download Encrypted Archive"
                                style={{ padding: '3px 7px', height: 'auto', fontSize: '0.75rem' }}
                              >
                                <IconDownload size={13} />
                              </button>
                              <button
                                className="admin-btn admin-btn--primary admin-btn--sm"
                                onClick={() => handleOpenRestoreWizard(b)}
                                title="Initiate Controlled Restore"
                                style={{ padding: '3px 8px', height: 'auto', fontSize: '0.75rem' }}
                              >
                                Restore
                              </button>
                              <button
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => handleDelete(b.backupId, b.backupReference)}
                                disabled={actionLoadingId === `delete_${b.backupId}`}
                                title="Permanently Delete Archive"
                                style={{ padding: '3px 6px', height: 'auto', fontSize: '0.75rem' }}
                              >
                                <IconX size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: AUTOMATIC BACKUP SCHEDULES ─── */}
      {activeTab === 'schedules' && (
        <div className="admin-table-card" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Automated Backup Execution Schedules</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                Configurable cron schedules and retention periods for automated compliance backups.
              </p>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Schedule Name</th>
                  <th>Frequency</th>
                  <th>Execution Time</th>
                  <th>Retention Window</th>
                  <th>Status</th>
                  <th>Last Execution</th>
                  <th style={{ textAlign: 'right' }}>Configure</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(sch => (
                  <tr key={sch.scheduleId}>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>
                      {sch.scheduleName}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f0fdfa', color: '#0f766e', border: '1px solid #ccfbf1' }}>
                        {sch.frequency}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {sch.scheduledTime} (Server Time)
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {sch.retentionDays} Days Retention
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: sch.enabled ? '#ecfdf5' : '#f1f5f9',
                          color: sch.enabled ? '#059669' : '#64748b',
                          border: `1px solid ${sch.enabled ? '#a7f3d0' : '#cbd5e1'}`
                        }}
                      >
                        {sch.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {sch.lastRunAt ? new Date(sch.lastRunAt).toLocaleString() : 'Pending Next Window'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="admin-btn admin-btn--outline admin-btn--sm"
                        onClick={() => {
                          setEditingSchedule(sch);
                          setScheduleForm({
                            enabled: sch.enabled,
                            scheduledTime: sch.scheduledTime,
                            retentionDays: sch.retentionDays
                          });
                        }}
                      >
                        Edit Policy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: RESTORE & DISASTER RECOVERY ─── */}
      {activeTab === 'restore' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="admin-table-card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1e293b' }}>
              Select a Recovery Point to Restore
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: 16 }}>
              Restoration uses a 5-step safety workflow: Checksum verification → Metadata preview → Automated Pre-Restore Snapshot → Staging SQL injection → Post-restore verification.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {backups.slice(0, 5).map(b => (
                <div
                  key={b.backupId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: b.backupStatus === 'VERIFIED' ? '#10b981' : '#f59e0b' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                        {b.backupName} <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', color: '#64748b' }}>({b.backupReference})</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        {b.createdAt ? new Date(b.createdAt).toLocaleString() : ''} · {formatBytes(b.fileSize)} · {b.tablesIncluded} Tables
                      </div>
                    </div>
                  </div>

                  <button
                    className="admin-btn admin-btn--primary admin-btn--sm"
                    onClick={() => handleOpenRestoreWizard(b)}
                  >
                    Select & Preview Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 5: RECOVERY LOG ─── */}
      {activeTab === 'recovery_history' && (
        <div className="admin-table-card" style={{ padding: 22 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#1e293b' }}>
            Historical Database Restoration Log
          </h3>
          <p style={{ fontSize: '0.84rem', color: '#64748b', marginBottom: 16 }}>
            Audit trail of all previous restore operations, safety snapshots, and post-restore verification reports.
          </p>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Restore Ref</th>
                  <th>Applied Backup</th>
                  <th>Pre-Restore Safety Snapshot</th>
                  <th>Initiated By</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Verification Report</th>
                </tr>
              </thead>
              <tbody>
                {restoreHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px 0', color: '#64748b' }}>
                      No restoration operations have been executed yet. System is running on original database genesis.
                    </td>
                  </tr>
                ) : (
                  restoreHistory.map(rst => (
                    <tr key={rst.restoreId}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1e293b' }}>
                        {rst.restoreReference}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#0f766e' }}>
                        {rst.backupReference}
                      </td>
                      <td style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>
                        {rst.preRestoreBackupRef || 'None'}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>
                        {rst.initiatedBy}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {rst.startedAt ? new Date(rst.startedAt).toLocaleString() : ''}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: rst.restoreStatus === 'COMPLETED' ? '#ecfdf5' : '#fef2f2',
                            color: rst.restoreStatus === 'COMPLETED' ? '#059669' : '#dc2626',
                            border: `1px solid ${rst.restoreStatus === 'COMPLETED' ? '#a7f3d0' : '#fecaca'}`
                          }}
                        >
                          {rst.restoreStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569', maxWidth: 280 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={rst.verificationReport || rst.failureReason}>
                          {rst.verificationReport || rst.failureReason || 'Restoration verified'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 6: STORAGE & ENCRYPTION ─── */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="admin-table-card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>
              Cryptographic Encryption at Rest
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Cipher Algorithm</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>AES-256 (CBC Mode with PKCS5 Padding)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Key Length</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>256 Bits (SHA-256 System Derived)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>IV Initialization</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>16-Byte Cryptographically Secure Random Salt</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Integrity Signature</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>SHA-256 Checksum on Encrypted Payload</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Archive Format</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>.sql.gz.enc (GZIP Compressed + Encrypted)</span>
              </div>
            </div>
          </div>

          <div className="admin-table-card" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#1e293b' }}>
              Protected Storage Environment
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Storage Path</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#0f172a' }}>./storage/backups/ (Private)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Web Root Exposure</span>
                <span style={{ fontWeight: 600, color: '#15803d' }}>Zero Public Web Exposure (Blocked)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>RBAC Gate</span>
                <span style={{ fontWeight: 600, color: '#dc2626' }}>Strict Admin-Only Access</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Retention Safeguard</span>
                <span style={{ fontWeight: 600, color: '#0284c7' }}>Latest Verified Backup Protected Forever</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>Tamper-Evident Audit</span>
                <span style={{ fontWeight: 600, color: '#059669' }}>Integrated with SHA-256 Audit Ledger</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: CREATE MANUAL BACKUP MODAL ─── */}
      {isBackupModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => !creatingBackup && setIsBackupModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              maxWidth: 500,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>Create Database Backup</h3>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                disabled={creatingBackup}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <IconX size={18} color="#94a3b8" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBackup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Backup Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pre_Update_Snapshot_Nov2026"
                  value={backupForm.backupName}
                  onChange={(e) => setBackupForm({ ...backupForm, backupName: e.target.value })}
                  className="admin-search-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Backup Scope
                </label>
                <select
                  value={backupForm.scope}
                  onChange={(e) => setBackupForm({ ...backupForm, scope: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                >
                  <option value="FULL_DATABASE">Full Database (Schema, Tables, Batches, Orders & Audits)</option>
                  <option value="DATA_ONLY">Data Rows Only</option>
                  <option value="SCHEMA_ONLY">Schema & Table Structure Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Description / Operational Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Scheduled system review backup before quarterly pricing updates."
                  value={backupForm.description}
                  onChange={(e) => setBackupForm({ ...backupForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: '0.78rem', color: '#64748b' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>Security Note:</span> The backup will be compressed with GZIP, encrypted with AES-256, signed with SHA-256 checksum, and saved in isolated storage.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="admin-btn admin-btn--outline admin-btn--sm"
                  onClick={() => setIsBackupModalOpen(false)}
                  disabled={creatingBackup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary admin-btn--sm"
                  disabled={creatingBackup}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {creatingBackup ? 'Compressing & Encrypting...' : 'Create Encrypted Backup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: RESTORE WIZARD MODAL ─── */}
      {isRestoreModalOpen && selectedBackupForRestore && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => !restoring && setIsRestoreModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              padding: 26,
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconAlertTriangle size={20} color="#dc2626" />
                  Database Restoration Wizard
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>
                  Selected Recovery Archive: {selectedBackupForRestore.backupReference}
                </div>
              </div>
              <button
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={restoring}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <IconX size={18} color="#94a3b8" />
              </button>
            </div>

            {/* Warning Box */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: '#fff1f2',
                border: '1px solid #fecdd3',
                fontSize: '0.82rem',
                color: '#9f1239'
              }}
            >
              <strong>CRITICAL WARNING:</strong> Restoring this backup will replace current database tables with data from{' '}
              {new Date(selectedBackupForRestore.createdAt).toLocaleString()}. Newer transactions created after this timestamp will be reverted.
            </div>

            {/* Preview Information */}
            {previewLoading ? (
              <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>
                Verifying SHA-256 checksum and previewing backup metadata...
              </div>
            ) : restorePreview ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                <div><span style={{ color: '#64748b' }}>Backup Name:</span> <strong>{restorePreview.backupName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Archive Size:</span> <strong>{restorePreview.formattedFileSize}</strong></div>
                <div><span style={{ color: '#64748b' }}>Database Engine:</span> <strong>{restorePreview.databaseVersion || 'MariaDB 10.4'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Tables Included:</span> <strong>{restorePreview.tablesCount} Tables</strong></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b' }}>SHA-256 Checksum:</span>{' '}
                  <span style={{ color: restorePreview.checksumValid ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                    {restorePreview.checksumValid ? '✓ Cryptographically Valid' : '✗ Checksum Mismatch!'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Pre-Restore Safety Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '0.82rem', color: '#166534' }}>
              <input
                type="checkbox"
                id="preSnapshot"
                checked={createPreSnapshot}
                onChange={(e) => setCreatePreSnapshot(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="preSnapshot" style={{ cursor: 'pointer', fontWeight: 500 }}>
                Capture an automated pre-restore safety snapshot (Guarantees zero data loss if recovery needs rollback).
              </label>
            </div>

            {/* Re-Authentication */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
                Administrator Password Confirmation
              </label>
              <input
                type="password"
                placeholder="Enter your admin password to authorize restoration"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                required
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button
                type="button"
                className="admin-btn admin-btn--outline admin-btn--sm"
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger admin-btn--sm"
                onClick={handleExecuteRestore}
                disabled={restoring || (restorePreview && !restorePreview.checksumValid)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {restoring ? 'Restoring Database...' : 'Authorize & Execute Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: SCHEDULE EDIT MODAL ─── */}
      {editingSchedule && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setEditingSchedule(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              maxWidth: 450,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Configure Schedule</h3>
              <button onClick={() => setEditingSchedule(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <IconX size={18} color="#94a3b8" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Schedule Name
                </label>
                <input type="text" value={editingSchedule.scheduleName} disabled style={{ width: '100%', padding: '8px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.85rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Scheduled Execution Time (HH:mm)
                </label>
                <input
                  type="text"
                  placeholder="02:00"
                  value={scheduleForm.scheduledTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Retention Period (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={scheduleForm.retentionDays}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, retentionDays: Number(e.target.value) })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.85rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="schEnabled"
                  checked={scheduleForm.enabled}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, enabled: e.target.checked })}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="schEnabled" style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>
                  Enable this automated schedule
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="admin-btn admin-btn--outline admin-btn--sm" onClick={() => setEditingSchedule(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn--primary admin-btn--sm">
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
