import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchReturns,
  fetchReturnAnalytics,
  fetchReturnInspections,
  createMedicineReturn,
  submitReturnInspection,
  resolveMedicineReturn,
  fetchBatches
} from '../../services/api';
import {
  IconPackage,
  IconShield,
  IconAlertTriangle,
  IconCheckCircle,
  IconSearch,
  IconRefresh,
  IconClock,
  IconTruck
} from '../icons/Icons';
import './MedicineReturnsTab.css';

export default function MedicineReturnsTab({ userRole = 'ADMIN', onToast }) {
  const [returnsList, setReturnsList] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectingItem, setInspectingItem] = useState(null);
  const [resolvingItem, setResolvingItem] = useState(null);
  const [viewHistoryItem, setViewHistoryItem] = useState(null);
  const [inspectionsHistory, setInspectionsHistory] = useState([]);

  // Form States
  const [newReturn, setNewReturn] = useState({
    batchId: '',
    quantity: 1,
    returnSource: 'DEPARTMENT_RETURN',
    returnReason: 'OVERSTOCK_SURPLUS',
    reasonDetails: '',
    department: 'Central Hospital'
  });

  const [inspectionForm, setInspectionForm] = useState({
    inspectionType: 'PHYSICAL_INTEGRITY',
    packagingIntact: true,
    temperatureMaintained: true,
    batchVerified: true,
    passed: true,
    findings: 'Packaging seals intact, temperature log verified, physical integrity confirmed.'
  });

  const [resolutionForm, setResolutionForm] = useState({
    resolutionAction: 'RESTOCK_USABLE_INVENTORY',
    notes: 'Approved after clinical inspection verification.'
  });

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const [retData, anaData, batchData] = await Promise.all([
        fetchReturns().catch(() => []),
        fetchReturnAnalytics().catch(() => null),
        fetchBatches().catch(() => [])
      ]);

      const items = retData?.data || retData || [];
      setReturnsList(Array.isArray(items) ? items : []);

      if (anaData?.data) setAnalytics(anaData.data);
      else if (anaData) setAnalytics(anaData);

      const bList = batchData?.data || batchData || [];
      setBatches(Array.isArray(bList) ? bList : []);
    } catch (err) {
      if (onToast) onToast('Failed to load medicine returns: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create Return Handler
  const handleCreateReturn = async (e) => {
    e.preventDefault();
    if (!newReturn.batchId) {
      if (onToast) onToast('Please select a medicine batch', 'warning');
      return;
    }

    try {
      await createMedicineReturn({
        ...newReturn,
        batchId: parseInt(newReturn.batchId, 10),
        quantity: parseInt(newReturn.quantity, 10)
      });
      setShowCreateModal(false);
      if (onToast) onToast('Medicine return registered into Quarantine isolation!', 'success');
      setNewReturn({
        batchId: '',
        quantity: 1,
        returnSource: 'DEPARTMENT_RETURN',
        returnReason: 'OVERSTOCK_SURPLUS',
        reasonDetails: '',
        department: 'Central Hospital'
      });
      loadData(true);
    } catch (err) {
      if (onToast) onToast('Error initiating return: ' + err.message, 'error');
    }
  };

  // Submit Inspection Handler
  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!inspectingItem) return;

    try {
      await submitReturnInspection(inspectingItem.returnId, inspectionForm);
      setInspectingItem(null);
      if (onToast) onToast(`Quality inspection recorded for ${inspectingItem.returnNumber}`, 'success');
      loadData(true);
    } catch (err) {
      if (onToast) onToast('Error submitting inspection: ' + err.message, 'error');
    }
  };

  // Resolve Return Handler
  const handleResolveReturn = async (e) => {
    e.preventDefault();
    if (!resolvingItem) return;

    try {
      await resolveMedicineReturn(resolvingItem.returnId, resolutionForm);
      setResolvingItem(null);
      if (onToast) onToast(`Return ${resolvingItem.returnNumber} resolved successfully!`, 'success');
      loadData(true);
    } catch (err) {
      if (onToast) onToast('Error resolving return: ' + err.message, 'error');
    }
  };

  // View Inspections History
  const handleViewHistory = async (item) => {
    setViewHistoryItem(item);
    try {
      const res = await fetchReturnInspections(item.returnId);
      const list = res?.data || res || [];
      setInspectionsHistory(Array.isArray(list) ? list : []);
    } catch (_err) {
      setInspectionsHistory([]);
    }
  };

  // Filtered Returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter(item => {
      const matchesSearch =
        !searchQuery ||
        (item.returnNumber && item.returnNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.medicine?.medicineName && item.medicine.medicineName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.batch?.batchNumber && item.batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.returnReason && item.returnReason.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || (item.status && item.status.toUpperCase() === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [returnsList, searchQuery, statusFilter]);

  return (
    <div className="returns-tab-wrapper">
      {/* Header & Controls */}
      <div className="returns-header">
        <div>
          <h3 className="returns-title">
            <IconShield className="returns-title-icon" /> Medicine Return Tracking & Quarantine Inspection
          </h3>
          <p className="returns-subtitle">
            Safety-enforced return lifecycle. Returned medicines enter quarantine immediately and can only re-enter usable inventory after authorized clinical quality inspection.
          </p>
        </div>

        <div className="returns-header-actions">
          {userRole !== 'SUPPLIER' && (
            <button
              className="clay-btn clay-btn--primary"
              onClick={() => setShowCreateModal(true)}
            >
              <IconPackage className="btn-icon" /> Initiate Return Request
            </button>
          )}

          <button
            className="clay-btn clay-btn--icon"
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh returns"
          >
            <IconRefresh className={`btn-icon ${refreshing ? 'spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="quarantine-safety-banner">
        <IconAlertTriangle className="safety-icon" />
        <div>
          <strong>Strict Medicine Safety Protocol:</strong> Returned medicines are kept in physical quarantine isolation. They are excluded from active dispensing inventory until physical seal and temperature audit pass quality check.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="returns-kpi-grid">
        <div className="returns-kpi-card">
          <div className="kpi-label">Total Return Claims</div>
          <div className="kpi-value">{analytics ? analytics.totalReturns : returnsList.length}</div>
          <div className="kpi-sub">Across departments, patients & suppliers</div>
        </div>

        <div className="returns-kpi-card returns-kpi-card--quarantine">
          <div className="kpi-label">Held in Quarantine</div>
          <div className="kpi-value">
            {analytics ? analytics.quarantinedCount : 0}
            <span className="kpi-badge">Isolated</span>
          </div>
          <div className="kpi-sub">Pending quality inspection</div>
        </div>

        <div className="returns-kpi-card returns-kpi-card--success">
          <div className="kpi-label">Restocked to Usable Stock</div>
          <div className="kpi-value">{analytics ? analytics.restockedCount : 0}</div>
          <div className="kpi-sub">Verified safe for patient care</div>
        </div>

        <div className="returns-kpi-card returns-kpi-card--danger">
          <div className="kpi-label">Supplier Claims / Wastage</div>
          <div className="kpi-value">
            {analytics ? (analytics.supplierReturnsCount + analytics.wastageDisposedCount) : 0}
          </div>
          <div className="kpi-sub">Forwarded for vendor credit or write-off</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="returns-filter-bar">
        <div className="returns-search-wrapper">
          <IconSearch className="search-icon" />
          <input
            type="text"
            className="returns-search-input"
            placeholder="Search by return #, medicine name, batch, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>&times;</button>
          )}
        </div>

        <div className="status-pill-group">
          {['ALL', 'QUARANTINED', 'UNDER_INSPECTION', 'APPROVED_FOR_RESTOCK', 'RESTOCKED', 'RETURNED_TO_SUPPLIER', 'TRANSFERRED_TO_WASTAGE'].map((st) => (
            <button
              key={st}
              className={`status-filter-pill ${statusFilter === st ? 'status-filter-pill--active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Returns Data Table */}
      <div className="returns-table-container">
        {loading ? (
          <div className="returns-loading">
            <div className="returns-spinner"></div>
            <span>Loading medicine return records...</span>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="returns-empty">
            <IconPackage className="empty-icon" />
            <h4>No medicine return records found</h4>
            <p>Click "Initiate Return Request" to record a department or patient medicine return.</p>
          </div>
        ) : (
          <table className="returns-table">
            <thead>
              <tr>
                <th>Return #</th>
                <th>Medicine & Batch</th>
                <th>Source</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Quality Check</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.map((item) => (
                <tr key={item.returnId}>
                  <td>
                    <strong className="return-num-text">{item.returnNumber}</strong>
                    <span className="return-date-sub">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </td>
                  <td>
                    <div className="med-col">
                      <strong className="med-name">{item.medicine?.medicineName || 'Medicine'}</strong>
                      <span className="batch-pill">Batch: {item.batch?.batchNumber || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <span className="source-pill">{item.returnSource}</span>
                    <span className="dept-sub">{item.department || 'Hospital'}</span>
                  </td>
                  <td>
                    <span className="qty-highlight">{item.quantity} units</span>
                    <span className="val-sub">${item.totalValue ? Number(item.totalValue).toFixed(2) : '0.00'}</span>
                  </td>
                  <td>
                    <span className="reason-text">{item.returnReason}</span>
                  </td>
                  <td>
                    <span className={`return-badge return-badge--${item.status.toLowerCase()}`}>
                      <span className="status-dot"></span>
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    {item.qualityStatus ? (
                      <span className={`quality-badge quality-badge--${item.qualityStatus.toLowerCase()}`}>
                        {item.qualityStatus === 'PASSED_QUALITY_CHECK' ? '✓ Passed' : '✗ Failed'}
                      </span>
                    ) : (
                      <span className="quality-badge quality-badge--pending">Pending Check</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {userRole !== 'SUPPLIER' && (item.status === 'QUARANTINED' || item.status === 'UNDER_INSPECTION') && (
                        <button
                          className="table-action-btn table-action-btn--inspect"
                          onClick={() => setInspectingItem(item)}
                          title="Perform Quality Inspection"
                        >
                          Inspect
                        </button>
                      )}

                      {(userRole === 'ADMIN' || userRole === 'PHARMACIST') &&
                        item.status !== 'RESTOCKED' &&
                        item.status !== 'TRANSFERRED_TO_WASTAGE' &&
                        item.status !== 'CLOSED' && (
                          <button
                            className="table-action-btn table-action-btn--resolve"
                            onClick={() => setResolvingItem(item)}
                            title="Authorize Resolution"
                          >
                            Resolve
                          </button>
                        )}

                      <button
                        className="table-action-btn"
                        onClick={() => handleViewHistory(item)}
                        title="View inspection findings"
                      >
                        History
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Initiate Return Request */}
      {showCreateModal && (
        <div className="clay-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconPackage className="modal-title-icon" /> Initiate Medicine Return Request
              </h3>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleCreateReturn}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Medicine Batch *</label>
                  <select
                    required
                    className="clay-input"
                    value={newReturn.batchId}
                    onChange={(e) => setNewReturn({ ...newReturn, batchId: e.target.value })}
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.medicine?.medicineName} &bull; Batch {b.batchNumber} (Avail: {b.quantityAvailable})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Return Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="clay-input"
                      value={newReturn.quantity}
                      onChange={(e) => setNewReturn({ ...newReturn, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Return Source *</label>
                    <select
                      className="clay-input"
                      value={newReturn.returnSource}
                      onChange={(e) => setNewReturn({ ...newReturn, returnSource: e.target.value })}
                    >
                      <option value="DEPARTMENT_RETURN">Department / Ward Return</option>
                      <option value="PATIENT_RETURN">Outpatient Return</option>
                      <option value="SUPPLIER_RETURN">Supplier Delivery Return</option>
                      <option value="INTERNAL_RECALL">Internal Safety Recall</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Return Reason *</label>
                    <select
                      className="clay-input"
                      value={newReturn.returnReason}
                      onChange={(e) => setNewReturn({ ...newReturn, returnReason: e.target.value })}
                    >
                      <option value="OVERSTOCK_SURPLUS">Overstock / Unused Surplus</option>
                      <option value="DAMAGED_PACKAGING">Damaged Packaging / Vial Crushed</option>
                      <option value="PATIENT_DISCONTINUED">Treatment Discontinued</option>
                      <option value="SUSPECTED_CONTAMINATION">Suspected Cold Chain Break</option>
                      <option value="NEAR_EXPIRY_RECALL">Near-Expiry Return</option>
                      <option value="WRONG_DISPENSE">Incorrect Dispensing Correction</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Hospital Department / Ward</label>
                    <input
                      type="text"
                      className="clay-input"
                      value={newReturn.department}
                      onChange={(e) => setNewReturn({ ...newReturn, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Clinical Notes / Details</label>
                  <textarea
                    rows="3"
                    className="clay-input"
                    placeholder="Describe packaging condition, temperature status, or clinical reasons..."
                    value={newReturn.reasonDetails}
                    onChange={(e) => setNewReturn({ ...newReturn, reasonDetails: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="clay-btn clay-btn--secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="clay-btn clay-btn--primary">
                  <IconShield className="btn-icon" /> Quarantine & Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Perform Quality Inspection */}
      {inspectingItem && (
        <div className="clay-modal-overlay" onClick={() => setInspectingItem(null)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconShield className="modal-title-icon" /> Quality Inspection: {inspectingItem.returnNumber}
              </h3>
              <button className="modal-close-btn" onClick={() => setInspectingItem(null)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitInspection}>
              <div className="modal-body">
                <div className="inspection-item-summary">
                  <strong>{inspectingItem.medicine?.medicineName}</strong> (Batch: {inspectingItem.batch?.batchNumber})
                  <div>Quantity in Quarantine: {inspectingItem.quantity} units</div>
                </div>

                <div className="checklist-box">
                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={inspectionForm.packagingIntact}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, packagingIntact: e.target.checked })}
                    />
                    <span>Packaging, tamper seals, and blister packs intact</span>
                  </label>

                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={inspectionForm.temperatureMaintained}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, temperatureMaintained: e.target.checked })}
                    />
                    <span>Temperature chain maintained during custody</span>
                  </label>

                  <label className="check-item">
                    <input
                      type="checkbox"
                      checked={inspectionForm.batchVerified}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, batchVerified: e.target.checked })}
                    />
                    <span>Batch number and expiry date match clinical records</span>
                  </label>

                  <label className="check-item check-item--highlight">
                    <input
                      type="checkbox"
                      checked={inspectionForm.passed}
                      onChange={(e) => setInspectionForm({ ...inspectionForm, passed: e.target.checked })}
                    />
                    <span><strong>Overall Quality Status: PASSED (Approved for clinical restock review)</strong></span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Inspection Findings & Clinical Remarks *</label>
                  <textarea
                    rows="3"
                    required
                    className="clay-input"
                    value={inspectionForm.findings}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, findings: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="clay-btn clay-btn--secondary" onClick={() => setInspectingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="clay-btn clay-btn--primary">
                  <IconCheckCircle className="btn-icon" /> Complete Inspection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Authorize Resolution */}
      {resolvingItem && (
        <div className="clay-modal-overlay" onClick={() => setResolvingItem(null)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconCheckCircle className="modal-title-icon" /> Authorize Resolution: {resolvingItem.returnNumber}
              </h3>
              <button className="modal-close-btn" onClick={() => setResolvingItem(null)}>&times;</button>
            </div>

            <form onSubmit={handleResolveReturn}>
              <div className="modal-body">
                <div className="inspection-item-summary">
                  <div><strong>Medicine:</strong> {resolvingItem.medicine?.medicineName} ({resolvingItem.quantity} units)</div>
                  <div><strong>Quality Audit Status:</strong> {resolvingItem.qualityStatus || 'Pending Check'}</div>
                </div>

                <div className="form-group">
                  <label>Resolution Action *</label>
                  <select
                    className="clay-input"
                    value={resolutionForm.resolutionAction}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, resolutionAction: e.target.value })}
                  >
                    <option
                      value="RESTOCK_USABLE_INVENTORY"
                      disabled={resolvingItem.qualityStatus !== 'PASSED_QUALITY_CHECK'}
                    >
                      Restock into Active Inventory {resolvingItem.qualityStatus !== 'PASSED_QUALITY_CHECK' ? '(Requires Quality Pass)' : ''}
                    </option>
                    <option value="DISPOSE_TO_WASTAGE">Dispose & Forward to Wastage Management</option>
                    <option value="DISPATCH_TO_SUPPLIER_CREDIT">Dispatch to Supplier for Credit / RMA</option>
                    <option value="REJECT_RETURN">Reject Return Claim</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Authorization Remarks</label>
                  <textarea
                    rows="3"
                    className="clay-input"
                    value={resolutionForm.notes}
                    onChange={(e) => setResolutionForm({ ...resolutionForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="clay-btn clay-btn--secondary" onClick={() => setResolvingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="clay-btn clay-btn--primary">
                  Confirm & Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Inspections History */}
      {viewHistoryItem && (
        <div className="clay-modal-overlay" onClick={() => setViewHistoryItem(null)}>
          <div className="clay-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <IconClock className="modal-title-icon" /> Inspection History: {viewHistoryItem.returnNumber}
              </h3>
              <button className="modal-close-btn" onClick={() => setViewHistoryItem(null)}>&times;</button>
            </div>

            <div className="modal-body">
              {inspectionsHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No physical inspection logs recorded yet. This item is held in quarantine.
                </div>
              ) : (
                <div className="inspection-timeline">
                  {inspectionsHistory.map((insp) => (
                    <div key={insp.inspectionId} className="timeline-item">
                      <div className="timeline-badge">
                        {insp.passed ? '✓' : '✗'}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title">
                          <strong>{insp.inspectionType}</strong> &bull; Inspector: {insp.inspector?.fullName || 'Clinical Staff'}
                        </div>
                        <div className="timeline-date">
                          {insp.inspectedAt ? new Date(insp.inspectedAt).toLocaleString() : 'Recent'}
                        </div>
                        <p className="timeline-findings">{insp.findings}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="clay-btn clay-btn--secondary" onClick={() => setViewHistoryItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

