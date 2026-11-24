import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchMyFeedbackTickets,
  fetchFeedbackTicketById,
  sendFeedbackMessage,
  uploadFeedbackAttachment,
  rateFeedbackResolution,
  reopenFeedbackTicket,
  createFeedbackTicketJson,
  createFeedbackTicketMultipart,
  analyzeDraftFeedback,
  fetchAllFeedbackTickets,
  fetchFeedbackAnalytics,
  updateFeedbackTicketStatus,
  updateFeedbackTicketPriority,
  assignFeedbackTicket,
  resolveFeedbackTicket,
  addFeedbackInternalNote,
  fetchFeedbackAiInsights,
  fetchAdminUsers
} from '../../services/api';
import {
  IconMessageSquare,
  IconStar,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconSearch,
  IconRefresh,
  IconPlus,
  IconX,
  IconLock,
  IconFileText,
  IconUser,
  IconShield,
  IconSparkles,
  IconUpload,
  IconDownload
} from '../../components/icons/Icons';
import './FeedbackHubPage.css';

const CATEGORIES_BY_ROLE = {
  ADMIN: [
    'System Configuration',
    'General Suggestions',
    'Inventory Issues',
    'Medicine Management Issues',
    'Purchase Order Issues',
    'Supplier Issues',
    'FEFO Issues',
    'Expiry Management Issues',
    'Wastage Management Issues',
    'Technical Problems',
    'Feature Requests',
    'Other'
  ],
  PHARMACIST: [
    'Inventory Issues',
    'Medicine Quantity Discrepancy',
    'FEFO Issues',
    'Expiry Management Issues',
    'Purchase Order Issues',
    'Supplier Issues',
    'Wastage Management Issues',
    'AI Forecast Recommendation Feedback',
    'General Suggestions',
    'Technical Problems',
    'Other'
  ],
  STAFF: [
    'Physical Stock Discrepancy',
    'Medicine Receiving Issues',
    'Damaged Medicine / Cartons',
    'Near-Expiry Batch Found',
    'Incorrect Batch Information',
    'Stock Check Problem',
    'General Suggestions',
    'Technical Problems',
    'Other'
  ],
  SUPPLIER: [
    'Delivery Transit Delay',
    'Purchase Order Quantity Discrepancy',
    'Product / Batch Availability Issues',
    'Damaged Delivery Reporting',
    'Delivery Documentation / Receipt Issue',
    'Payment Related Queries',
    'General Suggestions',
    'Other'
  ]
};

const MODULES = [
  'Stock Management',
  'Medicine Management',
  'Receive Medicines',
  'Purchase Orders',
  'FEFO Inventory',
  'Expiry Tracking',
  'Wastage Management',
  'Supplier Portal',
  'System / Technical'
];

export default function FeedbackHubPage({ role: propRole }) {
  // Determine current active role
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('medistock_user');
      return stored ? JSON.parse(stored) : { role: 'STAFF', fullName: 'User', userId: 0 };
    } catch (_e) {
      return { role: 'STAFF', fullName: 'User', userId: 0 };
    }
  }, []);

  const role = propRole || currentUser.role || 'STAFF';
  const isAdmin = role === 'ADMIN';

  // Navigation State
  const [activeTab, setActiveTab] = useState(isAdmin ? 'all' : 'my'); // 'overview', 'all', 'my', 'submit', 'analytics'
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Tickets List State
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Selected Ticket for Details / Conversation Modal
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('conversation'); // 'conversation', 'internal_notes', 'timeline', 'ai_insights'

  // Submit Feedback Form State
  const [submitForm, setSubmitForm] = useState({
    title: '',
    description: '',
    category: CATEGORIES_BY_ROLE[role]?.[0] || 'General Suggestions',
    priority: 'MEDIUM',
    relatedModule: MODULES[0]
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiDraftInsights, setAiDraftInsights] = useState(null);
  const [analyzingDraft, setAnalyzingDraft] = useState(false);

  // Action Modals State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({ assignedTo: '', deadlineAt: '', assignmentNote: '' });

  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateForm, setRateForm] = useState({ rating: 5, comments: '', issueResolved: true });

  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // ── Load Tickets & Analytics ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [ticketsRes, analyticsRes, usersRes] = await Promise.all([
          fetchAllFeedbackTickets({
            search,
            category: categoryFilter,
            priority: priorityFilter,
            status: statusFilter,
            sourceRole: roleFilter,
            size: 100
          }),
          fetchFeedbackAnalytics().catch(() => null),
          fetchAdminUsers().catch(() => [])
        ]);
        setTickets(ticketsRes?.content || (Array.isArray(ticketsRes) ? ticketsRes : []));
        if (analyticsRes) setAnalytics(analyticsRes);
        if (Array.isArray(usersRes)) setStaffUsers(usersRes.filter(u => u.roleId === 2 || u.roleId === 3));
      } else {
        const myTickets = await fetchMyFeedbackTickets();
        setTickets(Array.isArray(myTickets) ? myTickets : []);
      }
    } catch (err) {
      showToast('danger', `Failed to load feedback: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, search, categoryFilter, priorityFilter, statusFilter, roleFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Load Specific Ticket Details ─────────────────────────────────────────
  const loadTicketDetails = useCallback(async (ticketId) => {
    setDetailsLoading(true);
    try {
      const details = await fetchFeedbackTicketById(ticketId);
      setTicketDetails(details);
      setSelectedTicketId(ticketId);
    } catch (err) {
      showToast('danger', `Failed to load ticket details: ${err.message}`);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // ── Submit Feedback Handler ─────────────────────────────────────────────
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!submitForm.title.trim() || !submitForm.description.trim()) {
      showToast('warning', 'Please provide both title and detailed description.');
      return;
    }

    setSubmitting(true);
    try {
      if (attachmentFile) {
        const formData = new FormData();
        const jsonBlob = new Blob([JSON.stringify(submitForm)], { type: 'application/json' });
        formData.append('feedback', jsonBlob);
        formData.append('file', attachmentFile);
        const res = await createFeedbackTicketMultipart(formData);
        showToast('success', `Feedback Ticket ${res.ticketNumber} submitted successfully!`);
      } else {
        const res = await createFeedbackTicketJson(submitForm);
        showToast('success', `Feedback Ticket ${res.ticketNumber} submitted successfully!`);
      }

      setSubmitForm({
        title: '',
        description: '',
        category: CATEGORIES_BY_ROLE[role]?.[0] || 'General Suggestions',
        priority: 'MEDIUM',
        relatedModule: MODULES[0]
      });
      setAttachmentFile(null);
      setAiDraftInsights(null);
      setActiveTab(isAdmin ? 'all' : 'my');
      loadData();
    } catch (err) {
      showToast('danger', `Failed to submit feedback: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── AI Draft Analysis ───────────────────────────────────────────────────
  const handleAnalyzeDraft = async () => {
    if (!submitForm.title.trim() && !submitForm.description.trim()) {
      showToast('warning', 'Type a title or description first to run AI triage.');
      return;
    }
    setAnalyzingDraft(true);
    try {
      const insights = await analyzeDraftFeedback({
        title: submitForm.title,
        description: submitForm.description,
        category: submitForm.category
      });
      setAiDraftInsights(insights);
      if (insights.recommendedPriority) {
        setSubmitForm(prev => ({ ...prev, priority: insights.recommendedPriority }));
      }
      showToast('success', 'AI triage complete: Priority and category recommended.');
    } catch (err) {
      showToast('danger', `AI analysis failed: ${err.message}`);
    } finally {
      setAnalyzingDraft(false);
    }
  };

  // ── Send Message in Ticket ──────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedTicketId) return;

    setSendingMessage(true);
    try {
      await sendFeedbackMessage(selectedTicketId, { message: messageInput.trim() });
      setMessageInput('');
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to send message: ${err.message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  // ── Add Internal Note (Admin) ───────────────────────────────────────────
  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteInput.trim() || !selectedTicketId) return;

    setSavingNote(true);
    try {
      await addFeedbackInternalNote(selectedTicketId, { note: internalNoteInput.trim() });
      setInternalNoteInput('');
      loadTicketDetails(selectedTicketId);
      showToast('success', 'Confidential administrative note saved.');
    } catch (err) {
      showToast('danger', `Failed to save internal note: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  // ── Assign Ticket (Admin) ───────────────────────────────────────────────
  const handleExecuteAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.assignedTo || !selectedTicketId) {
      showToast('warning', 'Please select a responsible user.');
      return;
    }
    try {
      await assignFeedbackTicket(selectedTicketId, {
        assignedTo: parseInt(assignForm.assignedTo, 10),
        deadlineAt: assignForm.deadlineAt ? assignForm.deadlineAt + ':00' : null,
        assignmentNote: assignForm.assignmentNote
      });
      showToast('success', 'Ticket assigned successfully.');
      setIsAssignModalOpen(false);
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to assign ticket: ${err.message}`);
    }
  };

  // ── Resolve Ticket (Admin) ──────────────────────────────────────────────
  const handleExecuteResolve = async (e) => {
    e.preventDefault();
    if (!resolveNotes.trim() || !selectedTicketId) {
      showToast('warning', 'Resolution notes are required.');
      return;
    }
    try {
      await resolveFeedbackTicket(selectedTicketId, { resolutionNotes: resolveNotes.trim() });
      showToast('success', 'Ticket marked as RESOLVED.');
      setIsResolveModalOpen(false);
      setResolveNotes('');
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to resolve ticket: ${err.message}`);
    }
  };

  // ── Submit Rating (Submitter) ───────────────────────────────────────────
  const handleExecuteRate = async (e) => {
    e.preventDefault();
    if (!selectedTicketId) return;
    try {
      await rateFeedbackResolution(selectedTicketId, rateForm);
      showToast('success', 'Thank you! Your resolution rating was submitted.');
      setIsRateModalOpen(false);
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to submit rating: ${err.message}`);
    }
  };

  // ── Reopen Ticket ───────────────────────────────────────────────────────
  const handleExecuteReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim() || !selectedTicketId) {
      showToast('warning', 'Reopen reason is required.');
      return;
    }
    try {
      await reopenFeedbackTicket(selectedTicketId, { reopenReason: reopenReason.trim() });
      showToast('success', 'Ticket reopened for investigation.');
      setIsReopenModalOpen(false);
      setReopenReason('');
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to reopen ticket: ${err.message}`);
    }
  };

  // ── Quick Status / Priority Change (Admin) ──────────────────────────────
  const handleQuickStatusChange = async (newStatus) => {
    if (!selectedTicketId) return;
    try {
      await updateFeedbackTicketStatus(selectedTicketId, { status: newStatus, reason: 'Quick status update via dashboard' });
      showToast('success', `Status updated to ${newStatus}`);
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to update status: ${err.message}`);
    }
  };

  const handleQuickPriorityChange = async (newPriority) => {
    if (!selectedTicketId) return;
    try {
      await updateFeedbackTicketPriority(selectedTicketId, { priority: newPriority, reason: 'Priority adjusted by Administrator' });
      showToast('success', `Priority changed to ${newPriority}`);
      loadTicketDetails(selectedTicketId);
      loadData();
    } catch (err) {
      showToast('danger', `Failed to update priority: ${err.message}`);
    }
  };

  // Helper badge stylers
  const renderStatusBadge = (status) => {
    const s = (status || 'SUBMITTED').toUpperCase();
    let bg = '#E0F2FE';
    let text = '#0369A1';
    if (s === 'UNDER_REVIEW') { bg = '#FEF3C7'; text = '#92400E'; }
    else if (s === 'ASSIGNED') { bg = '#EDE9FE'; text = '#6D28D9'; }
    else if (s === 'IN_PROGRESS') { bg = '#CCFBF1'; text = '#0F766E'; }
    else if (s === 'WAITING_FOR_INFORMATION') { bg = '#FFEDD5'; text = '#C2410C'; }
    else if (s === 'RESOLVED') { bg = '#D1FAE5'; text = '#065F46'; }
    else if (s === 'CLOSED') { bg = '#F1F5F9'; text = '#475569'; }
    else if (s === 'REJECTED') { bg = '#FFE4E6'; text = '#9F1239'; }
    else if (s === 'REOPENED') { bg = '#FEE2E2'; text = '#991B1B'; }

    return (
      <span className="feedback-status-badge" style={{ backgroundColor: bg, color: text }}>
        {s.replace(/_/g, ' ')}
      </span>
    );
  };

  const renderPriorityBadge = (priority) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    let bg = '#E2E8F0';
    let text = '#475569';
    if (p === 'CRITICAL') { bg = '#FEE2E2'; text = '#991B1B'; }
    else if (p === 'HIGH') { bg = '#FFEDD5'; text = '#C2410C'; }
    else if (p === 'MEDIUM') { bg = '#E0F2FE'; text = '#0369A1'; }
    else if (p === 'LOW') { bg = '#F1F5F9'; text = '#64748B'; }

    return (
      <span className="feedback-priority-badge" style={{ backgroundColor: bg, color: text }}>
        {p === 'CRITICAL' && <span className="feedback-pulsing-dot" />}
        {p}
      </span>
    );
  };

  const renderRoleBadge = (sourceRole) => {
    const r = (sourceRole || 'STAFF').toUpperCase();
    let bg = '#E0F2FE';
    let text = '#0369A1';
    if (r === 'ADMIN') { bg = '#FEE2E2'; text = '#991B1B'; }
    else if (r === 'PHARMACIST') { bg = '#CCFBF1'; text = '#0F766E'; }
    else if (r === 'STAFF') { bg = '#EDE9FE'; text = '#6D28D9'; }
    else if (r === 'SUPPLIER') { bg = '#FEF3C7'; text = '#92400E'; }

    return (
      <span className="feedback-role-badge" style={{ backgroundColor: bg, color: text }}>
        {r}
      </span>
    );
  };

  return (
    <div className="feedback-hub-container">
      {/* ─── HEADER ─── */}
      <div className="feedback-header admin-card">
        <div className="feedback-header__left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="feedback-header__icon">
              <IconMessageSquare size={26} style={{ color: '#008C8C' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, color: '#16324F' }}>
                {isAdmin ? 'Feedback & Issue Resolution Management' : `${role.charAt(0) + role.slice(1).toLowerCase()} Support & Feedback`}
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                {isAdmin
                  ? 'Centralized communication, issue tracking, and AI-assisted resolution for all hospital roles.'
                  : 'Report discrepancies, logistics delays, or system suggestions directly to administration.'}
              </p>
            </div>
          </div>
        </div>

        <div className="feedback-header__actions">
          <button
            type="button"
            className="feedback-btn feedback-btn--primary"
            onClick={() => setActiveTab('submit')}
          >
            <IconPlus size={16} /> Submit Feedback
          </button>
          <button
            type="button"
            className="feedback-btn feedback-btn--outline"
            onClick={loadData}
          >
            <IconRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className={`feedback-toast feedback-toast--${toast.type}`}>
          {toast.type === 'success' && <IconCheckCircle size={18} />}
          {toast.type === 'danger' && <IconAlertTriangle size={18} />}
          {toast.type === 'warning' && <IconAlertTriangle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── ADMIN KPI METRIC CARDS ─── */}
      {isAdmin && analytics && (
        <div className="feedback-kpis-grid">
          <div className="feedback-kpi-card">
            <div className="feedback-kpi-card__label">Total Feedback</div>
            <div className="feedback-kpi-card__value">{analytics.totalTickets}</div>
            <div className="feedback-kpi-card__sub">Across all 4 roles</div>
          </div>
          <div className="feedback-kpi-card">
            <div className="feedback-kpi-card__label">Pending Review</div>
            <div className="feedback-kpi-card__value" style={{ color: '#D97706' }}>{analytics.pendingTickets}</div>
            <div className="feedback-kpi-card__sub">Awaiting admin triage</div>
          </div>
          <div className="feedback-kpi-card">
            <div className="feedback-kpi-card__label">In Progress</div>
            <div className="feedback-kpi-card__value" style={{ color: '#008C8C' }}>{analytics.inProgressTickets}</div>
            <div className="feedback-kpi-card__sub">Assigned & active</div>
          </div>
          <div className="feedback-kpi-card">
            <div className="feedback-kpi-card__label">Critical Issues</div>
            <div className="feedback-kpi-card__value" style={{ color: '#DC2626' }}>{analytics.criticalTickets}</div>
            <div className="feedback-kpi-card__sub">High risk flags</div>
          </div>
          <div className="feedback-kpi-card">
            <div className="feedback-kpi-card__label">Avg Resolution Time</div>
            <div className="feedback-kpi-card__value">{analytics.averageResolutionTimeHours} <span style={{ fontSize: '0.85rem' }}>hrs</span></div>
            <div className="feedback-kpi-card__sub">{analytics.resolvedPercentage}% resolved</div>
          </div>
          <div className="feedback-kpi-card">
            <div className="feedback-kpi-card__label">User Satisfaction</div>
            <div className="feedback-kpi-card__value" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F59E0B' }}>
              <IconStar size={20} style={{ fill: '#F59E0B' }} />
              {analytics.averageSatisfactionRating || '5.0'}
            </div>
            <div className="feedback-kpi-card__sub">{analytics.totalRatingsCount} ratings</div>
          </div>
        </div>
      )}

      {/* ─── NAVIGATION TABS ─── */}
      <div className="feedback-tabs-nav">
        {isAdmin && (
          <button
            type="button"
            className={`feedback-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <IconFileText size={16} /> All Feedback ({tickets.length})
          </button>
        )}
        <button
          type="button"
          className={`feedback-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          <IconUser size={16} /> {isAdmin ? 'My Assigned / Raised' : 'My Feedback'}
        </button>
        <button
          type="button"
          className={`feedback-tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
          onClick={() => setActiveTab('submit')}
        >
          <IconPlus size={16} /> Submit Feedback
        </button>
        {isAdmin && (
          <button
            type="button"
            className={`feedback-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <IconSparkles size={16} /> Analytics & Intelligence
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: ALL TICKETS / MY TICKETS LIST
         ══════════════════════════════════════════════════════════════ */}
      {(activeTab === 'all' || activeTab === 'my') && (
        <div className="feedback-content-card admin-card">
          {/* Filter Bar */}
          <div className="feedback-filter-bar">
            <div className="feedback-search-box">
              <IconSearch size={16} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search ticket number, title, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <IconX size={14} />
                </button>
              )}
            </div>

            {isAdmin && (
              <select
                className="feedback-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="PHARMACIST">Pharmacist</option>
                <option value="STAFF">Staff</option>
                <option value="SUPPLIER">Supplier</option>
              </select>
            )}

            <select
              className="feedback-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              className="feedback-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_INFORMATION">Waiting Info</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>

            {(search || roleFilter || priorityFilter || statusFilter || categoryFilter) && (
              <button
                type="button"
                className="feedback-btn feedback-btn--outline"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setPriorityFilter('');
                  setStatusFilter('');
                  setCategoryFilter('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Tickets Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <div className="feedback-spinner" />
              <p>Loading feedback records...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <IconMessageSquare size={48} style={{ color: '#CBD5E1', marginBottom: 12 }} />
              <h3 style={{ margin: '0 0 6px 0', color: '#334155' }}>No Feedback Tickets Found</h3>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No tickets match your active filter criteria.</p>
              <button
                type="button"
                className="feedback-btn feedback-btn--primary"
                style={{ marginTop: 16 }}
                onClick={() => setActiveTab('submit')}
              >
                <IconPlus size={16} /> Submit New Feedback
              </button>
            </div>
          ) : (
            <div className="feedback-table-wrapper">
              <table className="feedback-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Title & Category</th>
                    <th>Role</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitter</th>
                    <th>Assigned To</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.ticketId} onClick={() => loadTicketDetails(t.ticketId)}>
                      <td>
                        <span className="feedback-ticket-code">{t.ticketNumber}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#16324F', fontSize: '0.9rem' }}>{t.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{t.category} {t.relatedModule ? `• ${t.relatedModule}` : ''}</div>
                      </td>
                      <td>{renderRoleBadge(t.sourceRole)}</td>
                      <td>{renderPriorityBadge(t.priority)}</td>
                      <td>{renderStatusBadge(t.status)}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 500 }}>
                          {t.submitter?.fullName || 'User #' + t.submittedBy}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: t.assignedTo ? '#0F766E' : '#94A3B8' }}>
                          {t.assignee?.fullName || (t.assignedTo ? 'User #' + t.assignedTo : 'Unassigned')}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {t.createdAt ? t.createdAt.replace('T', ' ').substring(0, 16) : '—'}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="feedback-btn feedback-btn--sm feedback-btn--primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadTicketDetails(t.ticketId);
                          }}
                        >
                          View & Reply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: SUBMIT FEEDBACK FORM
         ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'submit' && (
        <div className="feedback-content-card admin-card" style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 16, marginBottom: 20 }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: '#16324F' }}>
              Submit New Feedback or Issue
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
              Provide full details below. Real-time AI triage will suggest the optimal priority and category.
            </p>
          </div>

          <form onSubmit={handleSubmitTicket}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label className="feedback-form-label">Category *</label>
                <select
                  className="feedback-select"
                  style={{ width: '100%' }}
                  value={submitForm.category}
                  onChange={(e) => setSubmitForm({ ...submitForm, category: e.target.value })}
                  required
                >
                  {(CATEGORIES_BY_ROLE[role] || CATEGORIES_BY_ROLE.STAFF).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="feedback-form-label">Related Application Module</label>
                <select
                  className="feedback-select"
                  style={{ width: '100%' }}
                  value={submitForm.relatedModule}
                  onChange={(e) => setSubmitForm({ ...submitForm, relatedModule: e.target.value })}
                >
                  {MODULES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="feedback-form-label">Feedback / Issue Title *</label>
              <input
                type="text"
                className="feedback-input"
                placeholder="e.g., Stock count discrepancy in Paracetamol Batch B-2024-001..."
                value={submitForm.title}
                onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className="feedback-form-label" style={{ margin: 0 }}>Detailed Description *</label>
                <button
                  type="button"
                  className="feedback-ai-assist-btn"
                  onClick={handleAnalyzeDraft}
                  disabled={analyzingDraft}
                >
                  <IconSparkles size={14} />
                  {analyzingDraft ? 'Analyzing...' : 'AI Triage Draft'}
                </button>
              </div>
              <textarea
                className="feedback-textarea"
                rows={5}
                placeholder="Explain the specific issue, batch number, dock delivery reference, or suggestion in detail..."
                value={submitForm.description}
                onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
                required
              />
            </div>

            {/* AI Draft Recommendation Box */}
            {aiDraftInsights && (
              <div className="feedback-ai-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: '#0F766E', marginBottom: 6 }}>
                  <IconSparkles size={16} />
                  <span>AI Feedback Intelligence Triage</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#CCFBF1', padding: '2px 8px', borderRadius: 12 }}>
                    {(aiDraftInsights.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#134E4A', lineHeight: 1.5 }}>
                  <div><strong>Recommended Priority:</strong> {renderPriorityBadge(aiDraftInsights.recommendedPriority)} — {aiDraftInsights.priorityReason}</div>
                  <div style={{ marginTop: 4 }}><strong>Sentiment:</strong> {aiDraftInsights.sentimentLabel} (Score: {aiDraftInsights.sentimentScore})</div>
                  {aiDraftInsights.duplicateCandidates?.length > 0 && (
                    <div style={{ marginTop: 4, color: '#B45309' }}>
                      <strong>Possible Duplicate Detected:</strong> {aiDraftInsights.duplicateCandidates.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label className="feedback-form-label">Priority</label>
                <select
                  className="feedback-select"
                  style={{ width: '100%' }}
                  value={submitForm.priority}
                  onChange={(e) => setSubmitForm({ ...submitForm, priority: e.target.value })}
                >
                  <option value="LOW">Low (Routine Suggestion)</option>
                  <option value="MEDIUM">Medium (Standard)</option>
                  <option value="HIGH">High (Discrepancy / Delay)</option>
                  <option value="CRITICAL">Critical (Safety / Hazard / Urgent)</option>
                </select>
              </div>

              <div>
                <label className="feedback-form-label">Supporting Screenshot or Document (Optional)</label>
                <input
                  type="file"
                  className="feedback-input"
                  style={{ padding: '6px 12px' }}
                  onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
                />
                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Max 15MB: PNG, JPG, PDF, CSV, TXT</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="feedback-btn feedback-btn--outline"
                onClick={() => setActiveTab(isAdmin ? 'all' : 'my')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="feedback-btn feedback-btn--primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: ANALYTICS & INTELLIGENCE DASHBOARD (ADMIN ONLY)
         ══════════════════════════════════════════════════════════════ */}
      {isAdmin && activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="feedback-analytics-grid">
            {/* By Role */}
            <div className="feedback-content-card admin-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#16324F' }}>
                Feedback Submissions by Role
              </h3>
              {Object.entries(analytics.ticketsByRole || {}).map(([r, count]) => {
                const pct = analytics.totalTickets > 0 ? (count / analytics.totalTickets) * 100 : 0;
                return (
                  <div key={r} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{r}</span>
                      <span style={{ color: '#64748B' }}>{count} tickets ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="feedback-progress-bar">
                      <div className="feedback-progress-fill" style={{ width: `${pct}%`, backgroundColor: '#008C8C' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* By Priority */}
            <div className="feedback-content-card admin-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#16324F' }}>
                Feedback by Priority
              </h3>
              {Object.entries(analytics.ticketsByPriority || {}).map(([p, count]) => {
                const pct = analytics.totalTickets > 0 ? (count / analytics.totalTickets) * 100 : 0;
                let barColor = '#008C8C';
                if (p === 'CRITICAL') barColor = '#DC2626';
                if (p === 'HIGH') barColor = '#EA580C';
                if (p === 'LOW') barColor = '#94A3B8';

                return (
                  <div key={p} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600 }}>{p}</span>
                      <span style={{ color: '#64748B' }}>{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="feedback-progress-bar">
                      <div className="feedback-progress-fill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* By Category */}
            <div className="feedback-content-card admin-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#16324F' }}>
                Frequently Reported Issue Categories
              </h3>
              {Object.entries(analytics.ticketsByCategory || {}).slice(0, 6).map(([c, count]) => {
                const pct = analytics.totalTickets > 0 ? (count / analytics.totalTickets) * 100 : 0;
                return (
                  <div key={c} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                      <span>{c}</span>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                    <div className="feedback-progress-bar">
                      <div className="feedback-progress-fill" style={{ width: `${pct}%`, backgroundColor: '#0284C7' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resolution Performance */}
            <div className="feedback-content-card admin-card">
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#16324F' }}>
                Resolution Performance
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: '#F0FDF4', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#15803D' }}>{analytics.resolvedPercentage}%</div>
                  <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: 4 }}>Resolved Tickets Ratio</div>
                </div>
                <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1D4ED8' }}>{analytics.averageResolutionTimeHours}h</div>
                  <div style={{ fontSize: '0.8rem', color: '#1E40AF', marginTop: 4 }}>Avg Resolution Time</div>
                </div>
              </div>
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#FFFBEB', borderRadius: 12, fontSize: '0.82rem', color: '#92400E' }}>
                <strong>Quality Assurance:</strong> Users submit 1–5 star ratings after resolution. Current average: <strong>{analytics.averageSatisfactionRating} / 5.0</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TICKET DETAILS / CONVERSATION MODAL
         ══════════════════════════════════════════════════════════════ */}
      {selectedTicketId && (
        <div className="feedback-modal-overlay" onClick={() => setSelectedTicketId(null)}>
          <div className="feedback-modal feedback-modal--large" onClick={(e) => e.stopPropagation()}>
            {detailsLoading || !ticketDetails ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div className="feedback-spinner" />
                <p>Loading ticket conversation...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="feedback-modal-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span className="feedback-ticket-code" style={{ fontSize: '1rem' }}>
                        {ticketDetails.ticket.ticketNumber}
                      </span>
                      {renderRoleBadge(ticketDetails.ticket.sourceRole)}
                      {renderPriorityBadge(ticketDetails.ticket.priority)}
                      {renderStatusBadge(ticketDetails.ticket.status)}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#16324F' }}>
                      {ticketDetails.ticket.title}
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>
                      Submitted by <strong>{ticketDetails.ticket.submitter?.fullName || 'User'}</strong> • Category: <strong>{ticketDetails.ticket.category}</strong>
                      {ticketDetails.ticket.relatedModule ? ` • Module: ${ticketDetails.ticket.relatedModule}` : ''}
                      {ticketDetails.ticket.deadlineAt ? ` • Deadline: ${ticketDetails.ticket.deadlineAt.replace('T', ' ').substring(0, 16)}` : ''}
                    </div>
                  </div>
                  <button type="button" className="feedback-modal-close" onClick={() => setSelectedTicketId(null)}>
                    <IconX size={20} />
                  </button>
                </div>

                {/* Modal Action Controls Bar */}
                <div className="feedback-modal-toolbar">
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="feedback-btn feedback-btn--sm feedback-btn--outline"
                        onClick={() => {
                          setAssignForm({
                            assignedTo: ticketDetails.ticket.assignedTo || '',
                            deadlineAt: ticketDetails.ticket.deadlineAt ? ticketDetails.ticket.deadlineAt.substring(0, 16) : '',
                            assignmentNote: ''
                          });
                          setIsAssignModalOpen(true);
                        }}
                      >
                        <IconUser size={14} /> {ticketDetails.ticket.assignedTo ? 'Reassign' : 'Assign'}
                      </button>

                      <button
                        type="button"
                        className="feedback-btn feedback-btn--sm feedback-btn--outline"
                        onClick={() => {
                          const nextP = ticketDetails.ticket.priority === 'CRITICAL' ? 'HIGH' : ticketDetails.ticket.priority === 'HIGH' ? 'MEDIUM' : 'CRITICAL';
                          handleQuickPriorityChange(nextP);
                        }}
                      >
                        Priority: {ticketDetails.ticket.priority}
                      </button>

                      {ticketDetails.ticket.status !== 'RESOLVED' && ticketDetails.ticket.status !== 'CLOSED' && (
                        <button
                          type="button"
                          className="feedback-btn feedback-btn--sm feedback-btn--primary"
                          onClick={() => {
                            setResolveNotes('');
                            setIsResolveModalOpen(true);
                          }}
                        >
                          <IconCheckCircle size={14} /> Resolve Issue
                        </button>
                      )}

                      <select
                        className="feedback-select"
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        value={ticketDetails.ticket.status}
                        onChange={(e) => handleQuickStatusChange(e.target.value)}
                      >
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="UNDER_REVIEW">UNDER REVIEW</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="WAITING_FOR_INFORMATION">WAITING INFO</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </>
                  )}

                  {/* Submitter Actions */}
                  {(ticketDetails.ticket.status === 'RESOLVED' || ticketDetails.ticket.status === 'CLOSED') && (
                    <>
                      <button
                        type="button"
                        className="feedback-btn feedback-btn--sm feedback-btn--primary"
                        onClick={() => {
                          setRateForm({ rating: ticketDetails.rating?.rating || 5, comments: ticketDetails.rating?.comments || '', issueResolved: true });
                          setIsRateModalOpen(true);
                        }}
                      >
                        <IconStar size={14} /> {ticketDetails.rating ? 'Update Rating' : 'Rate Resolution'}
                      </button>

                      <button
                        type="button"
                        className="feedback-btn feedback-btn--sm feedback-btn--outline"
                        style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                        onClick={() => {
                          setReopenReason('');
                          setIsReopenModalOpen(true);
                        }}
                      >
                        <IconRefresh size={14} /> Reopen Ticket
                      </button>
                    </>
                  )}
                </div>

                {/* Sub-tabs in Modal */}
                <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #E2E8F0', padding: '0 24px' }}>
                  <button
                    type="button"
                    className={`feedback-detail-tab ${activeDetailTab === 'conversation' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('conversation')}
                  >
                    Conversation ({ticketDetails.messages?.length || 0})
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      className={`feedback-detail-tab ${activeDetailTab === 'internal_notes' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('internal_notes')}
                    >
                      <IconLock size={12} /> Confidential Notes ({ticketDetails.internalNotes?.length || 0})
                    </button>
                  )}

                  <button
                    type="button"
                    className={`feedback-detail-tab ${activeDetailTab === 'timeline' ? 'active' : ''}`}
                    onClick={() => setActiveDetailTab('timeline')}
                  >
                    History & Status ({ticketDetails.statusHistory?.length || 0})
                  </button>

                  {isAdmin && ticketDetails.aiInsights && (
                    <button
                      type="button"
                      className={`feedback-detail-tab ${activeDetailTab === 'ai_insights' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('ai_insights')}
                    >
                      <IconSparkles size={12} /> AI Insights
                    </button>
                  )}
                </div>

                {/* Modal Body */}
                <div className="feedback-modal-body">
                  {/* TAB A: CONVERSATION */}
                  {activeDetailTab === 'conversation' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Resolution Banner if resolved */}
                      {ticketDetails.ticket.resolutionNotes && (
                        <div className="feedback-resolution-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#065F46', marginBottom: 4 }}>
                            <IconCheckCircle size={18} /> Resolution Verified
                          </div>
                          <p style={{ margin: 0, fontSize: '0.88rem', color: '#047857' }}>
                            {ticketDetails.ticket.resolutionNotes}
                          </p>
                          {ticketDetails.rating && (
                            <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>User Satisfaction:</span>
                              {[...Array(5)].map((_, i) => (
                                <IconStar
                                  key={i}
                                  size={14}
                                  style={{ fill: i < ticketDetails.rating.rating ? '#F59E0B' : 'none', color: '#F59E0B' }}
                                />
                              ))}
                              {ticketDetails.rating.comments && <span>— "{ticketDetails.rating.comments}"</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Messages Thread */}
                      <div className="feedback-messages-thread">
                        {ticketDetails.messages?.map((msg) => {
                          const isSelf = msg.senderId === currentUser.userId;
                          const isSys = msg.messageType === 'SYSTEM_EVENT';
                          const isAdminMsg = msg.messageType === 'ADMIN_RESPONSE';

                          if (isSys) {
                            return (
                              <div key={msg.messageId} className="feedback-sys-msg">
                                <span>{msg.message}</span>
                              </div>
                            );
                          }

                          return (
                            <div key={msg.messageId} className={`feedback-msg-bubble ${isSelf ? 'self' : 'other'}`}>
                              <div className="feedback-msg-bubble__header">
                                <strong>{msg.sender?.fullName || 'User'}</strong>
                                <span className="feedback-msg-bubble__badge">
                                  {isAdminMsg ? 'Admin' : 'User'}
                                </span>
                                <span className="feedback-msg-bubble__time">
                                  {msg.createdAt ? msg.createdAt.replace('T', ' ').substring(0, 16) : ''}
                                </span>
                              </div>
                              <div className="feedback-msg-bubble__body">
                                {msg.message}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Attachments Section if present */}
                      {ticketDetails.attachments?.length > 0 && (
                        <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                            Attached Documents ({ticketDetails.attachments.length}):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {ticketDetails.attachments.map((att) => (
                              <a
                                key={att.attachmentId}
                                href={`http://localhost:8080/api/feedback/attachments/${att.attachmentId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="feedback-attachment-pill"
                              >
                                <IconDownload size={14} />
                                <span>{att.originalFilename}</span>
                                <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>({(att.fileSize / 1024).toFixed(0)} KB)</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reply Input Box */}
                      {ticketDetails.ticket.status !== 'CLOSED' && ticketDetails.ticket.status !== 'REJECTED' && (
                        <form onSubmit={handleSendMessage} className="feedback-reply-box">
                          <textarea
                            className="feedback-textarea"
                            rows={3}
                            placeholder="Type your response to this ticket..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            required
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                            <button
                              type="submit"
                              className="feedback-btn feedback-btn--primary"
                              disabled={sendingMessage}
                            >
                              {sendingMessage ? 'Sending...' : 'Send Reply'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* TAB B: CONFIDENTIAL INTERNAL NOTES (ADMIN ONLY) */}
                  {isAdmin && activeDetailTab === 'internal_notes' && (
                    <div>
                      <div className="feedback-confidential-banner">
                        <IconLock size={16} />
                        <span>Confidential Administrative Notes — Visible ONLY to Administrators. Never shared with Pharmacists, Staff or Suppliers.</span>
                      </div>

                      {/* Add new note form */}
                      <form onSubmit={handleAddInternalNote} style={{ marginBottom: 20 }}>
                        <textarea
                          className="feedback-textarea"
                          rows={3}
                          placeholder="Record private administrative findings, investigation notes, supplier communications..."
                          value={internalNoteInput}
                          onChange={(e) => setInternalNoteInput(e.target.value)}
                          required
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            type="submit"
                            className="feedback-btn feedback-btn--primary"
                            disabled={savingNote}
                          >
                            <IconLock size={14} /> {savingNote ? 'Saving...' : 'Add Confidential Note'}
                          </button>
                        </div>
                      </form>

                      {/* Notes list */}
                      {ticketDetails.internalNotes?.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No confidential notes recorded yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {ticketDetails.internalNotes?.map((n) => (
                            <div key={n.noteId} className="feedback-internal-note-card">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#B45309', marginBottom: 4 }}>
                                <strong>Admin: {n.adminUser?.fullName || 'Administrator'}</strong>
                                <span>{n.createdAt ? n.createdAt.replace('T', ' ').substring(0, 16) : ''}</span>
                              </div>
                              <div style={{ fontSize: '0.88rem', color: '#78350F', lineHeight: 1.5 }}>
                                {n.note}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB C: STATUS HISTORY & TIMELINE */}
                  {activeDetailTab === 'timeline' && (
                    <div className="feedback-timeline">
                      {ticketDetails.statusHistory?.map((h) => (
                        <div key={h.historyId} className="feedback-timeline-item">
                          <div className="feedback-timeline-item__dot" />
                          <div className="feedback-timeline-item__content">
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#16324F' }}>
                              Status Changed: {renderStatusBadge(h.newStatus)} {h.oldStatus && <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>(from {h.oldStatus})</span>}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>
                              {h.changeReason || 'No notes specified.'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
                              By {h.changedByUser?.fullName || 'User #' + h.changedBy} • {h.changedAt ? h.changedAt.replace('T', ' ').substring(0, 16) : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB D: AI INSIGHTS & TRIAGE (ADMIN) */}
                  {isAdmin && activeDetailTab === 'ai_insights' && ticketDetails.aiInsights && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="feedback-ai-box">
                        <div style={{ fontWeight: 700, color: '#0F766E', marginBottom: 6 }}>
                          AI Triage Assessment Summary
                        </div>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.88rem', color: '#134E4A' }}>
                          {ticketDetails.aiInsights.summary}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: '0.85rem' }}>
                          <div><strong>Recommended Category:</strong> {ticketDetails.aiInsights.recommendedCategory}</div>
                          <div><strong>Recommended Priority:</strong> {renderPriorityBadge(ticketDetails.aiInsights.recommendedPriority)}</div>
                          <div><strong>Sentiment Polarity:</strong> {ticketDetails.aiInsights.sentimentLabel} ({ticketDetails.aiInsights.sentimentScore})</div>
                          <div><strong>AI Confidence:</strong> {(ticketDetails.aiInsights.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      {ticketDetails.aiInsights.suggestedAdminReply && (
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <strong style={{ fontSize: '0.85rem', color: '#334155' }}>AI Suggested Admin Reply</strong>
                            <button
                              type="button"
                              className="feedback-btn feedback-btn--sm feedback-btn--outline"
                              onClick={() => {
                                setMessageInput(ticketDetails.aiInsights.suggestedAdminReply);
                                setActiveDetailTab('conversation');
                              }}
                            >
                              Use Reply in Chat
                            </button>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569', fontStyle: 'italic' }}>
                            "{ticketDetails.aiInsights.suggestedAdminReply}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ASSIGN TICKET (ADMIN) ── */}
      {isAssignModalOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="feedback-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#16324F' }}>Assign Ticket</h3>
              <button type="button" className="feedback-modal-close" onClick={() => setIsAssignModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleExecuteAssign} style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label className="feedback-form-label">Assign Responsible User *</label>
                <select
                  className="feedback-select"
                  style={{ width: '100%' }}
                  value={assignForm.assignedTo}
                  onChange={(e) => setAssignForm({ ...assignForm, assignedTo: e.target.value })}
                  required
                >
                  <option value="">Select Pharmacist or Staff...</option>
                  {staffUsers.map((u) => (
                    <option key={u.userId} value={u.userId}>
                      {u.fullName} ({u.roleId === 2 ? 'Pharmacist' : 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="feedback-form-label">Resolution Deadline (Optional)</label>
                <input
                  type="datetime-local"
                  className="feedback-input"
                  value={assignForm.deadlineAt}
                  onChange={(e) => setAssignForm({ ...assignForm, deadlineAt: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="feedback-form-label">Assignment Instructions / Note</label>
                <textarea
                  className="feedback-textarea"
                  rows={3}
                  placeholder="e.g. Please verify physical batch count at Dock 2..."
                  value={assignForm.assignmentNote}
                  onChange={(e) => setAssignForm({ ...assignForm, assignmentNote: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="feedback-btn feedback-btn--outline" onClick={() => setIsAssignModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="feedback-btn feedback-btn--primary">
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RESOLVE TICKET (ADMIN) ── */}
      {isResolveModalOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsResolveModalOpen(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="feedback-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#16324F' }}>Resolve Ticket</h3>
              <button type="button" className="feedback-modal-close" onClick={() => setIsResolveModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleExecuteResolve} style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="feedback-form-label">Resolution Details & Actions Taken *</label>
                <textarea
                  className="feedback-textarea"
                  rows={4}
                  placeholder="Describe corrective actions taken (e.g. Stock adjusted by +60 units after warehouse recount)..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="feedback-btn feedback-btn--outline" onClick={() => setIsResolveModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="feedback-btn feedback-btn--primary">
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: RATE RESOLUTION (SUBMITTER) ── */}
      {isRateModalOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsRateModalOpen(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="feedback-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#16324F' }}>Rate Resolution Satisfaction</h3>
              <button type="button" className="feedback-modal-close" onClick={() => setIsRateModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleExecuteRate} style={{ padding: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: 8 }}>
                  How satisfied are you with the resolution of this issue?
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRateForm({ ...rateForm, rating: star })}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <IconStar
                        size={28}
                        style={{
                          fill: star <= rateForm.rating ? '#F59E0B' : 'none',
                          color: '#F59E0B',
                          transition: 'transform 0.15s ease'
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rateForm.issueResolved}
                    onChange={(e) => setRateForm({ ...rateForm, issueResolved: e.target.checked })}
                  />
                  <span>I confirm that the problem has been completely fixed.</span>
                </label>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="feedback-form-label">Comments / Feedback</label>
                <textarea
                  className="feedback-textarea"
                  rows={3}
                  placeholder="Describe your experience with the resolution..."
                  value={rateForm.comments}
                  onChange={(e) => setRateForm({ ...rateForm, comments: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="feedback-btn feedback-btn--outline" onClick={() => setIsRateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="feedback-btn feedback-btn--primary">
                  Submit Rating
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: REOPEN TICKET ── */}
      {isReopenModalOpen && (
        <div className="feedback-modal-overlay" onClick={() => setIsReopenModalOpen(false)}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="feedback-modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#16324F' }}>Reopen Ticket</h3>
              <button type="button" className="feedback-modal-close" onClick={() => setIsReopenModalOpen(false)}>
                <IconX size={18} />
              </button>
            </div>
            <form onSubmit={handleExecuteReopen} style={{ padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <label className="feedback-form-label">Reason for Reopening *</label>
                <textarea
                  className="feedback-textarea"
                  rows={4}
                  placeholder="Explain why the issue requires further administrative investigation..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="feedback-btn feedback-btn--outline" onClick={() => setIsReopenModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="feedback-btn feedback-btn--primary" style={{ backgroundColor: '#DC2626' }}>
                  Confirm Reopen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
