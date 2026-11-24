import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchFefoBatches,
  fetchFefoRecommendation,
  allocateFefoStock,
  fetchFefoComplianceReport,
  fetchFefoAllocations,
  fetchMedicines,
  updateBatchStatus,
} from '../../services/api';
import {
  IconBox,
  IconClock,
  IconAlertTriangle,
  IconSearch,
  IconRefresh,
  IconCheck,
  IconX,
  IconArrowRight,
  IconPill,
  IconShield,
  IconActivity,
  IconDownload,
  IconFileText,
  IconUsers,
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import './FefoPage.css';

export default function FefoPage({ userRole = 'PHARMACIST' }) {
  // Current user session
  const storedUser = localStorage.getItem('medistock_user');
  let currentUser = { role: userRole, fullName: 'Alex Rivera' };
  try {
    if (storedUser) currentUser = JSON.parse(storedUser);
  } catch (_e) {}

  const role = (currentUser.role || userRole).toUpperCase();
  const isAdmin = role.includes('ADMIN');
  const isPharmacist = role.includes('PHARM') || isAdmin;
  const isStaff = role.includes('STAFF') && !isAdmin && !isPharmacist;

  // Active view tab: 'inventory' | 'history' | 'analytics'
  const [activeTab, setActiveTab] = useState('inventory');

  // Loading & toast states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Data states
  const [batches, setBatches] = useState([]);
  const [complianceReport, setComplianceReport] = useState(null);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('ALL'); // ALL, ELIGIBLE, CRITICAL_7, NEAR_30, MODERATE_60, WARNING_90, EXPIRED
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, DEPLETED

  // Allocation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicineId, setSelectedMedicineId] = useState('');
  const [allocationQuantity, setAllocationQuantity] = useState(10);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [referenceType, setReferenceType] = useState('PRESCRIPTION');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [submittingAllocation, setSubmittingAllocation] = useState(false);

  // Batch Details Drawer / Status Modal State
  const [selectedBatchForStatus, setSelectedBatchForStatus] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState('QUARANTINED');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [batchesRes, reportRes, historyRes, medsRes] = await Promise.all([
        fetchFefoBatches({ search: searchQuery, filter: expiryFilter }),
        fetchFefoComplianceReport(),
        fetchFefoAllocations({ limit: 50 }),
        fetchMedicines(),
      ]);

      if (Array.isArray(batchesRes)) setBatches(batchesRes);
      if (reportRes) setComplianceReport(reportRes);
      if (Array.isArray(historyRes)) setAllocationHistory(historyRes);
      if (Array.isArray(medsRes)) setMedicinesList(medsRes);
    } catch (err) {
      console.error('Error loading FEFO data:', err);
      showToast(err.message || 'Failed to load FEFO inventory data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, expiryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Fetch recommendation whenever medicine, quantity, or selected batch changes in the modal
  useEffect(() => {
    if (!isModalOpen || !selectedMedicineId) {
      setRecommendation(null);
      return;
    }

    let isMounted = true;
    setRecLoading(true);

    fetchFefoRecommendation(
      selectedMedicineId,
      allocationQuantity || 1,
      selectedBatchId ? parseInt(selectedBatchId, 10) : null
    )
      .then((data) => {
        if (isMounted) setRecommendation(data);
      })
      .catch((err) => {
        console.error('Failed to get FEFO recommendation:', err);
      })
      .finally(() => {
        if (isMounted) setRecLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isModalOpen, selectedMedicineId, allocationQuantity, selectedBatchId]);

  // Handle opening allocation modal for a specific batch/medicine
  const openAllocationModal = (medId, batchId = null) => {
    setSelectedMedicineId(medId ? String(medId) : '');
    setSelectedBatchId(batchId ? String(batchId) : '');
    setAllocationQuantity(10);
    setOverrideReason('');
    setReferenceNumber(`FEFO-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setIsModalOpen(true);
  };

  // Confirm stock allocation
  const handleConfirmAllocation = async (e) => {
    e.preventDefault();
    if (!selectedMedicineId) {
      showToast('Please select a medicine', 'warning');
      return;
    }
    if (!allocationQuantity || allocationQuantity <= 0) {
      showToast('Requested quantity must be positive', 'warning');
      return;
    }

    // Check if an earlier batch is being skipped and override reason is missing
    const isOverriding =
      selectedBatchId &&
      recommendation &&
      recommendation.primaryRecommendation &&
      String(recommendation.primaryRecommendation.batchId) !== String(selectedBatchId);

    if (isOverriding && (!overrideReason || overrideReason.trim().length < 5)) {
      showToast(
        'Please enter a documented reason for skipping the earliest-expiring batch',
        'warning'
      );
      return;
    }

    setSubmittingAllocation(true);
    try {
      const payload = {
        medicineId: parseInt(selectedMedicineId, 10),
        requestedQuantity: parseInt(allocationQuantity, 10),
        selectedBatchId: selectedBatchId ? parseInt(selectedBatchId, 10) : null,
        referenceType,
        referenceNumber: referenceNumber || `RX-${Date.now().toString().slice(-6)}`,
        overrideReason: isOverriding ? overrideReason : null,
        notes,
      };

      await allocateFefoStock(payload);
      showToast(
        `Successfully allocated ${allocationQuantity} units under FEFO!`,
        'success'
      );
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Allocation error:', err);
      showToast(err.message || 'Failed to allocate stock', 'error');
    } finally {
      setSubmittingAllocation(false);
    }
  };

  // Handle Quarantine / Batch Status update
  const handleBatchStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchForStatus) return;

    setSubmittingStatus(true);
    try {
      await updateBatchStatus(
        selectedBatchForStatus.batchId,
        newStatusValue,
        statusChangeReason || 'Status update via FEFO Management console'
      );
      showToast(
        `Batch ${selectedBatchForStatus.batchNumber} updated to ${newStatusValue}`,
        'success'
      );
      setSelectedBatchForStatus(null);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update batch status', 'error');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Filtered batches for table display
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Stock filter
      if (stockFilter === 'IN_STOCK' && b.quantityAvailable <= 0) return false;
      if (stockFilter === 'LOW_STOCK' && (b.quantityAvailable <= 0 || b.quantityAvailable > 20)) return false;
      if (stockFilter === 'DEPLETED' && b.quantityAvailable > 0) return false;
      return true;
    });
  }, [batches, stockFilter]);

  // Export report as CSV
  const handleExportCsv = () => {
    if (activeTab === 'inventory') {
      const dataToExport = filteredBatches.map((b) => ({
        'Batch Number': b.batchNumber,
        'Medicine Name': b.medicineName,
        'Generic Name': b.genericName,
        'Category': b.categoryName,
        'Expiry Date': b.expiryDate,
        'Days Left': b.daysUntilExpiry,
        'Available Qty': b.quantityAvailable,
        'Status': b.status,
        'FEFO Recommendation': b.fefoRecommendation || 'N/A',
      }));
      exportToCsv(dataToExport, 'FEFO_Batches_Inventory.csv');
    } else {
      const dataToExport = allocationHistory.map((a) => ({
        'Allocation ID': a.allocationId,
        'Date': a.createdAt ? a.createdAt.replace('T', ' ').slice(0, 19) : '',
        'Medicine': a.medicine?.medicineName || `Med #${a.medicineId}`,
        'Batch': a.batch?.batchNumber || `Batch #${a.batchId}`,
        'Allocated Qty': a.allocatedQuantity,
        'FEFO Compliant': a.isFefoCompliant ? 'Yes' : 'No',
        'Override Reason': a.overrideReason || '',
        'Reference': `${a.referenceType || ''} ${a.referenceNumber || ''}`,
      }));
      exportToCsv(dataToExport, 'FEFO_Allocation_History.csv');
    }
    showToast('Exported CSV successfully', 'success');
  };

  // Determine recommendation badge class & text
  const getFefoBadge = (batch) => {
    if (batch.expired || batch.status === 'EXPIRED') {
      return <span className="fefo-badge fefo-badge--expired">⛔ Expired (Blocked)</span>;
    }
    if (batch.status === 'QUARANTINED') {
      return <span className="fefo-badge fefo-badge--quarantined">⚠️ Quarantined</span>;
    }
    if (batch.status === 'RECALLED') {
      return <span className="fefo-badge fefo-badge--quarantined">🚫 Recalled</span>;
    }
    if (batch.quantityAvailable <= 0) {
      return <span className="fefo-badge fefo-badge--later">Depleted</span>;
    }
    if (batch.fefoRank === 1) {
      return <span className="fefo-badge fefo-badge--use-first">⭐ Use First</span>;
    }
    if (batch.fefoRank === 2) {
      return <span className="fefo-badge fefo-badge--next">Next in Line</span>;
    }
    return <span className="fefo-badge fefo-badge--later">Later Batch</span>;
  };

  // Determine days remaining badge class
  const getDaysBadge = (batch) => {
    const days = batch.daysUntilExpiry;
    if (days < 0) {
      return <span className="fefo-days-badge fefo-days-badge--overdue">{Math.abs(days)}d Overdue</span>;
    }
    if (days <= 7) {
      return <span className="fefo-days-badge fefo-days-badge--critical">⏰ {days}d left (Critical)</span>;
    }
    if (days <= 30) {
      return <span className="fefo-days-badge fefo-days-badge--critical">⚠️ {days}d left</span>;
    }
    if (days <= 90) {
      return <span className="fefo-days-badge fefo-days-badge--moderate">📅 {days}d left</span>;
    }
    return <span className="fefo-days-badge fefo-days-badge--safe">✅ {days}d left</span>;
  };

  return (
    <div className="fefo-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`fefo-toast fefo-toast--${toast.type}`}>
          {toast.type === 'success' && <IconCheck size={18} />}
          {toast.type === 'warning' && <IconAlertTriangle size={18} />}
          {toast.type === 'error' && <IconX size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── Top Clinical Hero Banner (Image 4 & 5 style) ── */}
      <div className="fefo-hero">
        <div className="fefo-hero__content">
          <div className="fefo-hero__left">
            <div className="fefo-hero__tag">
              <span className="fefo-hero__tag-pulse"></span>
              Clinical Inventory Protocol • Active FEFO Enforcement
            </div>
            <h1 className="fefo-hero__title">
              FEFO — First Expired, First Out Management
            </h1>
            <p className="fefo-hero__subtitle">
              Prioritize medicine batches with the earliest expiry dates during dispensing.
              Prevent stock expiration, block quarantined supplies, and maintain high clinical compliance.
            </p>
          </div>

          <div className="fefo-hero__actions">
            <div className="fefo-hero__compliance-pill">
              <div>
                <div className="fefo-hero__compliance-pill-label">FEFO Compliance</div>
                <div className="fefo-hero__compliance-pill-value">
                  {complianceReport ? `${complianceReport.complianceRate}%` : '98.4%'}
                </div>
              </div>
              <IconShield size={28} color="#6EE7B7" />
            </div>

            {isPharmacist && (
              <button
                className="fefo-btn fefo-btn--primary"
                onClick={() => openAllocationModal('')}
                id="btn-new-fefo-allocation"
              >
                <IconBox size={18} />
                <span>Allocate / Dispense Stock</span>
              </button>
            )}

            <button
              className="fefo-btn fefo-btn--glass"
              onClick={handleExportCsv}
              title="Export CSV"
            >
              <IconDownload size={16} />
              <span>Export</span>
            </button>

            <button
              className="fefo-btn fefo-btn--glass"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Data"
            >
              <IconRefresh size={16} className={refreshing ? 'ms3d-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards (Matching Image 1 & 5) ── */}
      <div className="fefo-kpis">
        <div className="fefo-card fefo-kpi">
          <div className="fefo-kpi__header">
            <div className="fefo-kpi__icon-wrap fefo-kpi__icon-wrap--teal">
              <IconBox size={22} />
            </div>
            <span className="fefo-kpi__badge fefo-kpi__badge--green">Active Store</span>
          </div>
          <div className="fefo-kpi__body">
            <span className="fefo-kpi__label">Total Batches</span>
            <span className="fefo-kpi__value">{complianceReport?.totalBatches || batches.length}</span>
            <span className="fefo-kpi__sub">
              {complianceReport?.eligibleBatches || 0} batches eligible for dispensing
            </span>
          </div>
        </div>

        <div className="fefo-card fefo-kpi">
          <div className="fefo-kpi__header">
            <div className="fefo-kpi__icon-wrap fefo-kpi__icon-wrap--green">
              <IconCheck size={22} />
            </div>
            <span className="fefo-kpi__badge fefo-kpi__badge--green">Dispense Ready</span>
          </div>
          <div className="fefo-kpi__body">
            <span className="fefo-kpi__label">Eligible Batches</span>
            <span className="fefo-kpi__value">{complianceReport?.eligibleBatches || 0}</span>
            <span className="fefo-kpi__sub">Non-expired, unquarantined stock</span>
          </div>
        </div>

        <div className="fefo-card fefo-kpi">
          <div className="fefo-kpi__header">
            <div className="fefo-kpi__icon-wrap fefo-kpi__icon-wrap--amber">
              <IconClock size={22} />
            </div>
            <span className="fefo-kpi__badge fefo-kpi__badge--amber">Action Required</span>
          </div>
          <div className="fefo-kpi__body">
            <span className="fefo-kpi__label">Expiring Soon (≤ 60d)</span>
            <span className="fefo-kpi__value" style={{ color: '#D97706' }}>
              {complianceReport?.nearExpiryBatches || 0}
            </span>
            <span className="fefo-kpi__sub">
              {complianceReport?.expirySummary?.CRITICAL_7_DAYS || 0} batches expiring in ≤ 7 days
            </span>
          </div>
        </div>

        <div className="fefo-card fefo-kpi">
          <div className="fefo-kpi__header">
            <div className="fefo-kpi__icon-wrap fefo-kpi__icon-wrap--red">
              <IconAlertTriangle size={22} />
            </div>
            <span className="fefo-kpi__badge fefo-kpi__badge--red">Locked</span>
          </div>
          <div className="fefo-kpi__body">
            <span className="fefo-kpi__label">Expired / Blocked</span>
            <span className="fefo-kpi__value" style={{ color: '#DC2626' }}>
              {complianceReport?.expiredBatches || 0}
            </span>
            <span className="fefo-kpi__sub">Strictly excluded from dispensing</span>
          </div>
        </div>

        <div className="fefo-card fefo-kpi">
          <div className="fefo-kpi__header">
            <div className="fefo-kpi__icon-wrap fefo-kpi__icon-wrap--purple">
              <IconShield size={22} />
            </div>
            <span className="fefo-kpi__badge fefo-kpi__badge--green">High Standard</span>
          </div>
          <div className="fefo-kpi__body">
            <span className="fefo-kpi__label">FEFO Rate</span>
            <span className="fefo-kpi__value" style={{ color: '#008C8C' }}>
              {complianceReport ? `${complianceReport.complianceRate}%` : '98.4%'}
            </span>
            <span className="fefo-kpi__sub">
              {complianceReport?.nearExpiryUnitsSalvaged || 0} units salvaged under FEFO
            </span>
          </div>
        </div>
      </div>

      {/* ── FEFO Oldest-Batch Flow Guide (Image 2 style) ── */}
      <div className="fefo-flow-banner">
        <div className="fefo-flow-banner__info">
          <h4 className="fefo-flow-banner__title">
            <IconClock size={18} color="#008C8C" />
            FEFO Principle: Oldest Eligible Batch Always Moves First
          </h4>
          <p className="fefo-flow-banner__desc">
            The system automatically sorts and recommends batches by earliest expiry date.
            Near-expiry medicines are never stranded behind fresher deliveries.
          </p>
        </div>

        <div className="fefo-flow-banner__stages">
          <div className="fefo-stage-card fefo-stage-card--first">
            <span className="fefo-stage-card__tag">Pick First</span>
            <div className="fefo-stage-card__title">Batch A</div>
            <div className="fefo-stage-card__sub">Earliest Expiry</div>
          </div>

          <span className="fefo-stage-arrow">→</span>

          <div className="fefo-stage-card">
            <div className="fefo-stage-card__title">Batch B</div>
            <div className="fefo-stage-card__sub">Next in Line</div>
          </div>

          <span className="fefo-stage-arrow">→</span>

          <div className="fefo-stage-card">
            <div className="fefo-stage-card__title">Batch C</div>
            <div className="fefo-stage-card__sub">Later Expiry</div>
          </div>
        </div>
      </div>

      {/* ── Main View Tabs ── */}
      <div className="fefo-controls">
        <div className="fefo-tabs">
          <button
            className={`fefo-tab-btn ${activeTab === 'inventory' ? 'fefo-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Batch Inventory ({filteredBatches.length})
          </button>
          <button
            className={`fefo-tab-btn ${activeTab === 'history' ? 'fefo-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Allocation History ({allocationHistory.length})
          </button>
          <button
            className={`fefo-tab-btn ${activeTab === 'analytics' ? 'fefo-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Compliance & Expiry Analytics
          </button>
        </div>

        {activeTab === 'inventory' && (
          <div className="fefo-controls__filters">
            <div className="fefo-controls__search-group">
              <IconSearch size={16} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search medicine, generic or batch..."
                className="fefo-controls__search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  onClick={() => setSearchQuery('')}
                >
                  <IconX size={14} />
                </button>
              )}
            </div>

            <select
              className="fefo-select"
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
            >
              <option value="ALL">All Expiry Windows</option>
              <option value="ELIGIBLE">Eligible Only</option>
              <option value="CRITICAL_7">Critical (≤ 7 Days)</option>
              <option value="NEAR_30">Near Expiry (≤ 30 Days)</option>
              <option value="MODERATE_60">Moderate (≤ 60 Days)</option>
              <option value="WARNING_90">Warning (≤ 90 Days)</option>
              <option value="EXPIRED">Expired Batches</option>
              <option value="QUARANTINED">Quarantined</option>
            </select>

            <select
              className="fefo-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
            >
              <option value="ALL">All Stock Levels</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="LOW_STOCK">Low Stock (≤ 20)</option>
              <option value="DEPLETED">Depleted (0 units)</option>
            </select>
          </div>
        )}
      </div>

      {/* ── TAB 1: Batch-wise Inventory Table ── */}
      {activeTab === 'inventory' && (
        <div className="fefo-table-container">
          <div className="fefo-table-header">
            <h3 className="fefo-table-title">Batch-wise Medicine Inventory (FEFO Sorted)</h3>
            <span className="fefo-table-count">
              Showing {filteredBatches.length} batches
            </span>
          </div>

          <div className="fefo-table-wrap">
            <table className="fefo-table">
              <thead>
                <tr>
                  <th>FEFO Priority</th>
                  <th>Product / Medicine</th>
                  <th>Batch Number</th>
                  <th>Expiry Date</th>
                  <th>Days Left</th>
                  <th>Stock Available</th>
                  <th>Received</th>
                  <th>Batch Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      <IconRefresh size={24} className="ms3d-spin" style={{ marginBottom: '8px' }} />
                      <div>Loading FEFO batch inventory...</div>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      <IconBox size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                      <div>No matching batches found for the selected filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr key={batch.batchId}>
                      <td>{getFefoBadge(batch)}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#16324F' }}>{batch.medicineName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {batch.genericName || batch.brandName} • {batch.categoryName || 'General'}
                        </div>
                      </td>
                      <td>
                        <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                          {batch.batchNumber}
                        </code>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{batch.expiryDate}</div>
                        {batch.manufacturingDate && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                            Mfg: {batch.manufacturingDate}
                          </div>
                        )}
                      </td>
                      <td>{getDaysBadge(batch)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: batch.quantityAvailable === 0 ? '#94A3B8' : batch.quantityAvailable <= 20 ? '#D97706' : '#059669',
                          }}
                        >
                          {batch.quantityAvailable} units
                        </span>
                      </td>
                      <td style={{ color: '#64748B' }}>{batch.quantityReceived}</td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background:
                              batch.status === 'EXPIRED'
                                ? '#FEE2E2'
                                : batch.status === 'QUARANTINED'
                                ? '#FEECDC'
                                : batch.status === 'DEPLETED'
                                ? '#F1F5F9'
                                : '#DEF7EC',
                            color:
                              batch.status === 'EXPIRED'
                                ? '#991B1B'
                                : batch.status === 'QUARANTINED'
                                ? '#904A15'
                                : batch.status === 'DEPLETED'
                                ? '#64748B'
                                : '#03543F',
                          }}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {/* Pharmacist / Admin Allocation Action */}
                          {isPharmacist && batch.eligible && batch.quantityAvailable > 0 && (
                            <button
                              className="fefo-action-btn"
                              onClick={() => openAllocationModal(batch.medicineId, batch.batchId)}
                              title="Allocate this batch"
                            >
                              Allocate
                            </button>
                          )}

                          {/* Admin / Pharmacist Status Management (Quarantine / Reactivate) */}
                          {(isAdmin || isPharmacist) && (
                            <button
                              className="fefo-action-btn"
                              style={{ background: '#F8FAFC' }}
                              onClick={() => {
                                setSelectedBatchForStatus(batch);
                                setNewStatusValue(batch.status === 'QUARANTINED' ? 'ACTIVE' : 'QUARANTINED');
                                setStatusChangeReason('');
                              }}
                              title="Change status"
                            >
                              {batch.status === 'QUARANTINED' ? 'Reactivate' : 'Quarantine'}
                            </button>
                          )}

                          {isStaff && (
                            <button
                              className="fefo-action-btn"
                              onClick={() => openAllocationModal(batch.medicineId)}
                              title="Check FEFO priority"
                            >
                              Check FEFO
                            </button>
                          )}
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

      {/* ── TAB 2: Batch Allocation History Table (Matching Image 5) ── */}
      {activeTab === 'history' && (
        <div className="fefo-table-container">
          <div className="fefo-table-header">
            <div>
              <h3 className="fefo-table-title">Recent Inventory Transactions (FEFO Based Issues)</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                Inventory is issued based on FEFO (First Expired, First Out) to minimize expiry and ensure product quality.
              </p>
            </div>
            <span className="fefo-table-count">
              {allocationHistory.length} recorded allocations
            </span>
          </div>

          <div className="fefo-table-wrap">
            <table className="fefo-table">
              <thead>
                <tr>
                  <th>Allocation ID</th>
                  <th>Allocated On</th>
                  <th>Medicine</th>
                  <th>Batch Number</th>
                  <th>Batch Expiry</th>
                  <th>Issued Qty</th>
                  <th>Reference</th>
                  <th>FEFO Applied</th>
                  <th>Dispensed By</th>
                  <th>Deviation Notes</th>
                </tr>
              </thead>
              <tbody>
                {allocationHistory.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                      No allocation records found.
                    </td>
                  </tr>
                ) : (
                  allocationHistory.map((alloc) => (
                    <tr key={alloc.allocationId}>
                      <td>
                        <span style={{ fontWeight: 700, color: '#008C8C' }}>
                          TRX-{String(alloc.allocationId).padStart(5, '0')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#64748B' }}>
                        {alloc.createdAt ? alloc.createdAt.replace('T', ' ').slice(0, 16) : 'Just now'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {alloc.medicine ? alloc.medicine.medicineName : `Medicine #${alloc.medicineId}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                          {alloc.medicine?.genericName}
                        </div>
                      </td>
                      <td>
                        <code>{alloc.batch ? alloc.batch.batchNumber : `Batch #${alloc.batchId}`}</code>
                      </td>
                      <td>{alloc.batchExpiryDate}</td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{alloc.allocatedQuantity} units</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{alloc.referenceType}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{alloc.referenceNumber}</div>
                      </td>
                      <td>
                        {alloc.isFefoCompliant ? (
                          <span className="fefo-badge fefo-badge--compliant-yes">
                            ✅ Yes (Compliant)
                          </span>
                        ) : (
                          <span className="fefo-badge fefo-badge--compliant-no">
                            ⚠️ Overridden
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#475569' }}>
                        {alloc.user ? alloc.user.fullName : 'Pharmacist Alex Rivera'}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: alloc.overrideReason ? '#B45309' : '#94A3B8' }}>
                        {alloc.overrideReason || alloc.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Compliance & Expiry Analytics (Matching Image 5) ── */}
      {activeTab === 'analytics' && complianceReport && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Expiry Category Breakdown */}
          <div className="fefo-card">
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#16324F', fontWeight: 700 }}>
              Inventory by Expiry Category
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }}></span>
                  Expired (Past date)
                </span>
                <span style={{ fontWeight: 700, color: '#DC2626' }}>
                  {complianceReport.expirySummary?.EXPIRED || 0} batches
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }}></span>
                  Critical (≤ 7 days)
                </span>
                <span style={{ fontWeight: 700, color: '#D97706' }}>
                  {complianceReport.expirySummary?.CRITICAL_7_DAYS || 0} batches
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FBBF24' }}></span>
                  Near Expiry (8 to 30 days)
                </span>
                <span style={{ fontWeight: 700, color: '#B45309' }}>
                  {complianceReport.expirySummary?.NEAR_30_DAYS || 0} batches
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }}></span>
                  Moderate (31 to 60 days)
                </span>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>
                  {complianceReport.expirySummary?.MODERATE_60_DAYS || 0} batches
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#F8FAFC', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}></span>
                  Healthy (&gt; 90 days)
                </span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {complianceReport.expirySummary?.HEALTHY_OVER_90_DAYS || 0} batches
                </span>
              </div>
            </div>
          </div>

          {/* Compliance Trend / Key Metrics */}
          <div className="fefo-card">
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#16324F', fontWeight: 700 }}>
              FEFO Compliance Trend (Last 30 Days)
            </h4>
            <div style={{ background: '#F8FAFC', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', color: '#64748B' }}>Overall Compliance Score</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#008C8C' }}>
                  {complianceReport.complianceRate}%
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${complianceReport.complianceRate}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #008C8C, #10B981)',
                    borderRadius: '4px',
                  }}
                ></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase' }}>Compliant Issues</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669' }}>
                  {complianceReport.compliantAllocations}
                </div>
              </div>

              <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase' }}>Authorized Overrides</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#D97706' }}>
                  {complianceReport.overriddenAllocations}
                </div>
              </div>
            </div>

            {complianceReport.overrideReasons && complianceReport.overrideReasons.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Recorded Deviation Reasons
                </div>
                {complianceReport.overrideReasons.map((r, i) => (
                  <div
                    key={i}
                    style={{ fontSize: '0.78rem', color: '#64748B', padding: '4px 0', borderBottom: '1px dashed #E2E8F0' }}
                  >
                    • {r.reason} ({r.count}x)
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Interactive FEFO Stock Allocation Modal (Image 3 style) ── */}
      {isModalOpen && (
        <div className="fefo-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="fefo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fefo-modal__header">
              <div className="fefo-modal__title-group">
                <h3 className="fefo-modal__title">FEFO Stock Allocation & Dispensing</h3>
                <span className="fefo-modal__subtitle">
                  Issues stock starting from the earliest eligible batch to minimize inventory obsolescence.
                </span>
              </div>
              <button className="fefo-modal__close" onClick={() => setIsModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmAllocation}>
              <div className="fefo-modal__body">
                {/* Information Box */}
                <div className="fefo-info-box">
                  <IconShield size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <strong>FEFO Policy:</strong> The system automatically selects eligible batches in chronological order of expiration.
                    Expired and quarantined batches are automatically locked from dispensing.
                  </div>
                </div>

                {/* Medicine & Quantity Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div className="fefo-form-group">
                    <label className="fefo-form-label">Medicine</label>
                    <select
                      className="fefo-input"
                      value={selectedMedicineId}
                      onChange={(e) => {
                        setSelectedMedicineId(e.target.value);
                        setSelectedBatchId('');
                      }}
                      required
                    >
                      <option value="">-- Select Medicine to Dispense --</option>
                      {medicinesList.map((m) => (
                        <option key={m.medicineId} value={m.medicineId}>
                          {m.medicineName} ({m.genericName || m.strength || 'Standard'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="fefo-form-group">
                    <label className="fefo-form-label">Required Quantity</label>
                    <input
                      type="number"
                      className="fefo-input"
                      min="1"
                      value={allocationQuantity}
                      onChange={(e) => setAllocationQuantity(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Live Recommendation Section */}
                {recLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
                    <IconRefresh size={20} className="ms3d-spin" style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: '0.84rem' }}>Calculating earliest eligible batch...</div>
                  </div>
                ) : recommendation ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Primary FEFO Recommended Batch Banner */}
                    {recommendation.primaryRecommendation ? (
                      <div
                        style={{
                          background: 'linear-gradient(135deg, rgba(0, 140, 140, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                          border: '1.5px solid #008C8C',
                          borderRadius: '14px',
                          padding: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span className="fefo-badge fefo-badge--use-first" style={{ marginBottom: 6 }}>
                              ⭐ FEFO Recommended: Use First
                            </span>
                            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16324F' }}>
                              Batch {recommendation.primaryRecommendation.batchNumber}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 2 }}>
                              Expires on <strong>{recommendation.primaryRecommendation.expiryDate}</strong> ({recommendation.primaryRecommendation.daysLabel})
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.74rem', color: '#64748B', textTransform: 'uppercase' }}>Available Stock</div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#008C8C' }}>
                              {recommendation.primaryRecommendation.availableQuantity} units
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="fefo-warning-box">
                        <IconAlertTriangle size={18} />
                        <div>No active, non-expired batches found with stock for this medicine.</div>
                      </div>
                    )}

                    {/* Multi-batch split preview */}
                    {recommendation.allocationPlan && recommendation.allocationPlan.length > 1 && (
                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '14px' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                          ⚡ Multi-Batch Split Allocation Plan (Requested: {allocationQuantity} units)
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {recommendation.allocationPlan.map((planItem, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.8rem',
                                padding: '6px 10px',
                                background: '#ffffff',
                                borderRadius: '6px',
                              }}
                            >
                              <span>
                                <strong>{planItem.quantityToAllocate} units</strong> from {planItem.batchNumber} (Exp: {planItem.expiryDate})
                              </span>
                              <span style={{ color: '#008C8C', fontWeight: 600 }}>{planItem.recommendationLabel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Batch Selection Dropdown (Allows picking specific batch or auto-FEFO) */}
                    <div className="fefo-form-group">
                      <label className="fefo-form-label">
                        Target Batch Selection (Default: Auto FEFO)
                      </label>
                      <select
                        className="fefo-input"
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                      >
                        <option value="">⚡ Auto-allocate (Strict FEFO Earliest First)</option>
                        {recommendation.allEligibleBatches?.map((b) => (
                          <option key={b.batchId} value={b.batchId}>
                            Batch {b.batchNumber} — Exp: {b.expiryDate} ({b.availableQuantity} available) [{b.recommendationLabel}]
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* FEFO Deviation Warning when skipping earlier batch */}
                    {selectedBatchId &&
                      recommendation.primaryRecommendation &&
                      String(selectedBatchId) !== String(recommendation.primaryRecommendation.batchId) && (
                        <div className="fefo-warning-box">
                          <IconAlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>⚠️ FEFO Deviation Alert:</strong> You selected Batch {selectedBatchId}, but an earlier-expiring batch (
                            <strong>Batch {recommendation.primaryRecommendation.batchNumber}</strong>, Exp: {recommendation.primaryRecommendation.expiryDate} with{' '}
                            {recommendation.primaryRecommendation.availableQuantity} units) is available!
                            <div style={{ marginTop: '8px' }}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px' }}>
                                Clinical Justification Reason (Required):
                              </label>
                              <input
                                type="text"
                                className="fefo-input"
                                placeholder="e.g. Doctor specified brand, patient specific formulation..."
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Blocked batches notification */}
                    {recommendation.blockedBatches && recommendation.blockedBatches.length > 0 && (
                      <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                        ℹ️ Note: {recommendation.blockedBatches.length} batch(es) ({recommendation.blockedBatches.map(b => b.batchNumber).join(', ')}) are expired or quarantined and blocked from dispensing.
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Reference Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="fefo-form-group">
                    <label className="fefo-form-label">Reference Type</label>
                    <select
                      className="fefo-input"
                      value={referenceType}
                      onChange={(e) => setReferenceType(e.target.value)}
                    >
                      <option value="PRESCRIPTION">Prescription (Outpatient / Inpatient)</option>
                      <option value="WARD_SUPPLY">Ward Floor Stock Requisition</option>
                      <option value="EMERGENCY_DEPT">Emergency Care Dispensation</option>
                      <option value="CLINIC_TRANSFER">Departmental Transfer</option>
                    </select>
                  </div>

                  <div className="fefo-form-group">
                    <label className="fefo-form-label">Reference / Prescription #</label>
                    <input
                      type="text"
                      className="fefo-input"
                      placeholder="e.g. RX-2026-0918"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="fefo-form-group">
                  <label className="fefo-form-label">Dispensing Notes (Optional)</label>
                  <input
                    type="text"
                    className="fefo-input"
                    placeholder="Patient notes or clinical dispensing instructions"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="fefo-modal__footer">
                <button
                  type="button"
                  className="fefo-btn fefo-btn--glass"
                  style={{ color: '#64748B', borderColor: '#CBD5E1' }}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fefo-btn fefo-btn--teal"
                  disabled={submittingAllocation || !selectedMedicineId}
                  id="btn-confirm-fefo-allocation"
                >
                  {submittingAllocation ? (
                    <>
                      <IconRefresh size={16} className="ms3d-spin" />
                      <span>Allocating Stock...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={16} />
                      <span>Confirm FEFO Allocation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Batch Quarantine / Status Modal ── */}
      {selectedBatchForStatus && (
        <div className="fefo-modal-overlay" onClick={() => setSelectedBatchForStatus(null)}>
          <div className="fefo-modal" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="fefo-modal__header">
              <div className="fefo-modal__title-group">
                <h3 className="fefo-modal__title">Update Batch Status</h3>
                <span className="fefo-modal__subtitle">
                  Batch: {selectedBatchForStatus.batchNumber} ({selectedBatchForStatus.medicineName})
                </span>
              </div>
              <button className="fefo-modal__close" onClick={() => setSelectedBatchForStatus(null)}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleBatchStatusSubmit}>
              <div className="fefo-modal__body">
                <div className="fefo-form-group">
                  <label className="fefo-form-label">Select New Batch Status</label>
                  <select
                    className="fefo-input"
                    value={newStatusValue}
                    onChange={(e) => setNewStatusValue(e.target.value)}
                  >
                    <option value="ACTIVE">ACTIVE (Eligible for FEFO Dispensing)</option>
                    <option value="QUARANTINED">QUARANTINED (Hold from dispensing)</option>
                    <option value="RECALLED">RECALLED (Manufacturer / Safety recall)</option>
                    <option value="EXPIRED">EXPIRED (Decommissioned)</option>
                  </select>
                </div>

                <div className="fefo-form-group">
                  <label className="fefo-form-label">Reason for Status Change</label>
                  <textarea
                    className="fefo-input"
                    rows={3}
                    placeholder="Document quality inspection findings or recall notice..."
                    value={statusChangeReason}
                    onChange={(e) => setStatusChangeReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="fefo-modal__footer">
                <button
                  type="button"
                  className="fefo-btn fefo-btn--glass"
                  style={{ color: '#64748B', borderColor: '#CBD5E1' }}
                  onClick={() => setSelectedBatchForStatus(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="fefo-btn fefo-btn--teal"
                  disabled={submittingStatus}
                >
                  {submittingStatus ? 'Updating...' : 'Save Batch Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

