import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchEmailMonitoringStats,
  fetchEmailOutbox,
  fetchEmailLogs,
  retryEmailOutbox,
  testSmtpConnection,
  sendTestEmail
} from '../../services/api';
import {
  IconMail,
  IconSend,
  IconRefresh,
  IconActivity,
  IconAlertTriangle,
  IconCheckCircle,
  IconSearch,
  IconClock,
  IconShield
} from '../../components/icons/Icons';
import './AdminEmailMonitoringTab.css';

export default function AdminEmailMonitoringTab({ onToast }) {
  const [stats, setStats] = useState(null);
  const [outboxItems, setOutboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action State
  const [selectedItem, setSelectedItem] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailData, setTestEmailData] = useState({
    recipientEmail: 'admin@medistock.com',
    subject: '[TEST] MediStock SMTP Connectivity Verification',
    testCategory: 'PURCHASE_ORDER'
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [statsRes, outboxRes] = await Promise.all([
        fetchEmailMonitoringStats().catch(() => null),
        fetchEmailOutbox(0, 50, statusFilter).catch(() => null)
      ]);

      if (statsRes?.data) setStats(statsRes.data);
      else if (statsRes) setStats(statsRes);

      const items = outboxRes?.data || outboxRes || [];
      setOutboxItems(Array.isArray(items) ? items : []);
    } catch (err) {
      if (onToast) onToast('Failed to load email monitoring data: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, onToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const res = await testSmtpConnection();
      const data = res?.data || res;
      setSmtpStatus(data);
      if (data?.connected) {
        if (onToast) onToast(`SMTP Connection Successful! Latency: ${data.latencyMs}ms`, 'success');
      } else {
        if (onToast) onToast(`SMTP Ping Notice: ${data?.statusMessage || 'Unreachable'}`, 'warning');
      }
    } catch (err) {
      if (onToast) onToast('SMTP connection test failed: ' + err.message, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailData.recipientEmail) {
      if (onToast) onToast('Recipient email is required', 'warning');
      return;
    }

    try {
      await sendTestEmail(testEmailData);
      setShowTestModal(false);
      if (onToast) onToast(`Test email queued for ${testEmailData.recipientEmail}`, 'success');
      loadData(true);
    } catch (err) {
      if (onToast) onToast('Error sending test email: ' + err.message, 'error');
    }
  };

  const handleRetry = async (outboxId) => {
    try {
      setRetryingId(outboxId);
      await retryEmailOutbox(outboxId);
      if (onToast) onToast(`Email outbox #${outboxId} re-queued for delivery!`, 'success');
      loadData(true);
    } catch (err) {
      if (onToast) onToast('Error triggering retry: ' + err.message, 'error');
    } finally {
      setRetryingId(null);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return outboxItems.filter(item => {
      const matchesSearch =
        !searchQuery ||
        (item.recipientEmail && item.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.eventType && item.eventType.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || (item.status && item.status.toUpperCase() === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [outboxItems, searchQuery, statusFilter]);

  return (
    <div className="email-monitoring-wrapper">
      {/* Action Header */}
      <div className="email-monitoring-header">
        <div>
          <h3 className="email-mon-title">
            <IconMail className="email-mon-title-icon" /> SMTP Outbox & Email Delivery Monitoring
          </h3>
          <p className="email-mon-subtitle">
            Enterprise outbox queue, transactional SMTP delivery tracking, retries, and live mail server diagnostics.
          </p>
        </div>

        <div className="email-header-actions">
          <button
            className="clay-btn clay-btn--secondary"
            onClick={handleTestConnection}
            disabled={testingConnection}
            title="Ping configured SMTP mail server"
          >
            <IconActivity className="btn-icon" />
            {testingConnection ? 'Testing...' : 'Test SMTP Server'}
          </button>

          <button
            className="clay-btn clay-btn--primary"
            onClick={() => setShowTestModal(true)}
          >
            <IconSend className="btn-icon" /> Send Test Email
          </button>

          <button
            className="clay-btn clay-btn--icon"
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh queue"
          >
            <IconRefresh className={`btn-icon ${refreshing ? 'spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* SMTP Live Ping Result Banner */}
      {smtpStatus && (
        <div className={`smtp-status-banner ${smtpStatus.connected ? 'smtp-status-banner--success' : 'smtp-status-banner--warning'}`}>
          <div className="smtp-banner-info">
            <span className="smtp-banner-dot"></span>
            <strong>SMTP Host Status:</strong> {smtpStatus.host}:{smtpStatus.port} ({smtpStatus.protocol}) &bull;{' '}
            {smtpStatus.statusMessage}
            {smtpStatus.latencyMs ? ` (${smtpStatus.latencyMs} ms)` : ''}
          </div>
          <button className="smtp-banner-close" onClick={() => setSmtpStatus(null)}>&times;</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="email-kpi-grid">
        <div className="email-kpi-card">
          <div className="kpi-label">Total Outbox Messages</div>
          <div className="kpi-value">{stats ? stats.totalOutbox : '—'}</div>
          <div className="kpi-sub">Lifetime transactional emails queued</div>
        </div>

        <div className="email-kpi-card email-kpi-card--success">
          <div className="kpi-label">Successfully Submitted</div>
          <div className="kpi-value">
            {stats ? stats.sentCount : '—'}
            <span className="kpi-badge">{stats ? `${stats.successRatePercent}%` : '100%'}</span>
          </div>
          <div className="kpi-sub">Delivered via SMTP transport</div>
        </div>

        <div className="email-kpi-card email-kpi-card--pending">
          <div className="kpi-label">Pending / In Outbox</div>
          <div className="kpi-value">{stats ? stats.pendingCount : '0'}</div>
          <div className="kpi-sub">Queued for async background worker</div>
        </div>

        <div className="email-kpi-card email-kpi-card--danger">
          <div className="kpi-label">Failed Deliveries</div>
          <div className="kpi-value">{stats ? stats.failedCount : '0'}</div>
          <div className="kpi-sub">Exceeded max retry attempts</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="email-filter-bar">
        <div className="email-search-wrapper">
          <IconSearch className="search-icon" />
          <input
            type="text"
            className="email-search-input"
            placeholder="Search by recipient email, subject, or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>&times;</button>
          )}
        </div>

        <div className="status-pill-group">
          {['ALL', 'SENT', 'PENDING', 'FAILED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              className={`status-filter-pill ${statusFilter === st ? 'status-filter-pill--active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Outbox & Logs Table */}
      <div className="email-table-container">
        {loading ? (
          <div className="email-table-loading">
            <div className="email-spinner"></div>
            <span>Loading transactional email records...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="email-table-empty">
            <IconMail className="empty-icon" />
            <h4>No email outbox records found</h4>
            <p>Emails generated by purchase orders, inventory alerts, and tasks will appear here.</p>
          </div>
        ) : (
          <table className="email-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Event Type</th>
                <th>Recipient</th>
                <th>Subject</th>
                <th>Attempts</th>
                <th>Timestamp</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.outboxId}>
                  <td>
                    <span className={`email-status-badge email-status-badge--${(item.status || 'PENDING').toLowerCase()}`}>
                      <span className="status-dot"></span>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <span className="event-type-pill">{item.eventType}</span>
                  </td>
                  <td>
                    <div className="recipient-col">
                      <strong className="recipient-name">{item.recipientName || 'Valued User'}</strong>
                      <span className="recipient-email">{item.recipientEmail}</span>
                    </div>
                  </td>
                  <td>
                    <span className="subject-text" title={item.subject}>
                      {item.subject}
                    </span>
                  </td>
                  <td>
                    <span className="attempts-pill">
                      {item.attempts} / {item.maxAttempts}
                    </span>
                  </td>
                  <td>
                    <span className="time-text">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Recent'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="table-action-btn"
                        onClick={() => setSelectedItem(item)}
                        title="View payload and metadata"
                      >
                        Details
                      </button>

                      {(item.status === 'FAILED' || item.status === 'PENDING') && (
                        <button
                          className="table-action-btn table-action-btn--retry"
                          onClick={() => handleRetry(item.outboxId)}
                          disabled={retryingId === item.outboxId}
                          title="Retry delivery now"
                        >
                          {retryingId === item.outboxId ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Details & Payload Modal */}
      {selectedItem && (
        <div className="clay-modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconMail className="modal-title-icon" /> Outbox Message #{selectedItem.outboxId}
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>

            <div className="modal-body">
              <div className="modal-meta-grid">
                <div>
                  <label>Status</label>
                  <span className={`email-status-badge email-status-badge--${(selectedItem.status || 'PENDING').toLowerCase()}`}>
                    {selectedItem.status}
                  </span>
                </div>
                <div>
                  <label>Event Type</label>
                  <strong>{selectedItem.eventType}</strong>
                </div>
                <div>
                  <label>Recipient Email</label>
                  <strong>{selectedItem.recipientEmail}</strong>
                </div>
                <div>
                  <label>Recipient Name</label>
                  <span>{selectedItem.recipientName || 'N/A'}</span>
                </div>
                <div>
                  <label>Attempts</label>
                  <span>{selectedItem.attempts} of {selectedItem.maxAttempts}</span>
                </div>
                <div>
                  <label>Idempotency Key</label>
                  <code className="code-pill">{selectedItem.idempotencyKey}</code>
                </div>
              </div>

              {selectedItem.errorMessage && (
                <div className="error-alert-box">
                  <IconAlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <div>
                    <strong>Transmission Error:</strong> {selectedItem.errorMessage}
                  </div>
                </div>
              )}

              <div className="payload-box">
                <label>Template Data Payload (JSON)</label>
                <pre>{formatJson(selectedItem.templateDataJson)}</pre>
              </div>
            </div>

            <div className="modal-footer">
              {(selectedItem.status === 'FAILED' || selectedItem.status === 'PENDING') && (
                <button
                  className="clay-btn clay-btn--primary"
                  onClick={() => {
                    handleRetry(selectedItem.outboxId);
                    setSelectedItem(null);
                  }}
                >
                  <IconRefresh className="btn-icon" /> Retry Delivery Now
                </button>
              )}
              <button className="clay-btn clay-btn--secondary" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      {showTestModal && (
        <div className="clay-modal-overlay" onClick={() => setShowTestModal(false)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconSend className="modal-title-icon" /> Send SMTP Verification Email
              </h3>
              <button className="modal-close-btn" onClick={() => setShowTestModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSendTestEmail}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    className="clay-input"
                    value={testEmailData.recipientEmail}
                    onChange={(e) => setTestEmailData({ ...testEmailData, recipientEmail: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Subject Line</label>
                  <input
                    type="text"
                    required
                    className="clay-input"
                    value={testEmailData.subject}
                    onChange={(e) => setTestEmailData({ ...testEmailData, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Category Template</label>
                  <select
                    className="clay-input"
                    value={testEmailData.testCategory}
                    onChange={(e) => setTestEmailData({ ...testEmailData, testCategory: e.target.value })}
                  >
                    <option value="PURCHASE_ORDER">Purchase Order Alert</option>
                    <option value="INVENTORY_ALERT">Inventory Low Stock Alert</option>
                    <option value="EXPIRY_FEFO">FEFO & Expiry Warning</option>
                    <option value="TASK_ASSIGNMENT">Staff Task Assignment</option>
                    <option value="SYSTEM">General System Verification</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="clay-btn clay-btn--secondary" onClick={() => setShowTestModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="clay-btn clay-btn--primary">
                  <IconSend className="btn-icon" /> Queue & Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatJson(jsonStr) {
  if (!jsonStr) return '{}';
  try {
    const obj = JSON.parse(jsonStr);
    return JSON.stringify(obj, null, 2);
  } catch (_e) {
    return jsonStr;
  }
}

