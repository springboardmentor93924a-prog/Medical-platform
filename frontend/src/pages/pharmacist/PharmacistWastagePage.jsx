import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchWastageRecords,
  fetchPendingWastageApprovals,
  createWastageReport,
  verifyWastageReport,
  fetchBatches
} from '../../services/api';
import {
  IconAlertTriangle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconDownload,
  IconFilter,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrash,
  IconX,
  IconEye,
  IconFileText,
  IconPrinter
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import './PharmacistMedicinesPage.css';
import '../admin/AdminPages.css';

const SEED_PHARMACIST_WASTAGE = [
  {
    wastageId: 2,
    medicineId: 8,
    medicineName: 'Ciprofloxacin 500mg',
    batchId: 108,
    batchNumber: 'CIP2024012',
    categoryName: 'Antibiotics',
    quantity: 45,
    unitCost: 14.00,
    totalLoss: 630.00,
    supplierRecovery: 500.00,
    netLoss: 130.00,
    reason: 'DAMAGED',
    physicalCondition: 'Outer carton crushed and ampoules shattered in transit',
    status: 'SUBMITTED',
    reportedByName: 'Nurse Emily Watson',
    reportedRole: 'STAFF',
    reportedAt: '2026-11-08T11:00:00Z',
    verifiedByName: null,
    verifiedAt: null,
    verificationNotes: null
  },
  {
    wastageId: 3,
    medicineId: 2,
    medicineName: 'Amoxicillin 250mg',
    batchId: 103,
    batchNumber: 'AMX2024003',
    categoryName: 'Antibiotics',
    quantity: 20,
    unitCost: 8.00,
    totalLoss: 160.00,
    supplierRecovery: 0.00,
    netLoss: 160.00,
    reason: 'CONTAMINATED',
    physicalCondition: 'Moisture ingress observed in packaging seals',
    status: 'VERIFIED',
    reportedByName: 'Alex Rivera, PharmD',
    reportedRole: 'PHARMACIST',
    reportedAt: '2026-11-09T08:45:00Z',
    verifiedByName: 'Alex Rivera, PharmD',
    verifiedAt: '2026-11-09T09:00:00Z',
    verificationNotes: 'Quarantined immediately to prevent cross contamination.'
  },
  {
    wastageId: 1,
    medicineId: 6,
    medicineName: 'Vitamin D3 1000IU',
    batchId: 107,
    batchNumber: 'VIT2024009',
    categoryName: 'Supplements',
    quantity: 120,
    unitCost: 9.00,
    totalLoss: 1080.00,
    supplierRecovery: 0.00,
    netLoss: 1080.00,
    reason: 'EXPIRED',
    physicalCondition: 'Expired beyond acceptable buffer date',
    status: 'WRITTEN_OFF',
    reportedByName: 'Nurse Emily Watson',
    reportedRole: 'STAFF',
    reportedAt: '2026-11-01T09:30:00Z',
    verifiedByName: 'Alex Rivera, PharmD',
    verifiedAt: '2026-11-01T14:15:00Z',
    verificationNotes: 'Physical count verified. Shelf life exhausted.'
  }
];

export default function PharmacistWastagePage() {
  const [records, setRecords] = useState(SEED_PHARMACIST_WASTAGE);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMsg, setToastMsg] = useState(null);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Verify Form State
  const [verifiedQty, setVerifiedQty] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [conditionConfirmed, setConditionConfirmed] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Report Form State
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [reportQty, setReportQty] = useState('');
  const [reportReason, setReportReason] = useState('EXPIRED');
  const [reportCondition, setReportCondition] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, batchList] = await Promise.all([
        fetchWastageRecords(),
        fetchBatches()
      ]);
      if (recs && Array.isArray(recs)) setRecords(recs);
      if (batchList && Array.isArray(batchList)) setBatches(batchList);
    } catch (_e) {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    setProcessing(true);
    try {
      const payload = {
        verifiedQuantity: verifiedQty ? parseInt(verifiedQty, 10) : selectedRecord.quantity,
        notes: verificationNotes || 'Physically inspected and verified by Clinical Pharmacist.',
        conditionVerified: conditionConfirmed
      };
      await verifyWastageReport(selectedRecord.wastageId, payload);
      showToast(`Batch ${selectedRecord.batchNumber} verified and forwarded to Admin for write-off approval.`);
      setShowVerifyModal(false);
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Error verifying report');
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!selectedBatchId || !reportQty) {
      alert('Please select a batch and enter the quantity.');
      return;
    }
    const chosenBatch = batches.find((b) => String(b.batchId) === String(selectedBatchId));
    if (!chosenBatch) {
      alert('Selected batch not found');
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        medicineId: chosenBatch.medicineId,
        medicineName: chosenBatch.medicineName,
        batchId: chosenBatch.batchId,
        batchNumber: chosenBatch.batchNumber,
        categoryName: chosenBatch.categoryName || 'General',
        quantity: parseInt(reportQty, 10),
        unitCost: chosenBatch.purchaseCost || 5.0,
        reason: reportReason,
        physicalCondition: reportCondition || 'Identified during dispensary stock rotation',
        notes: reportNotes
      };
      await createWastageReport(payload);
      showToast(`Batch ${chosenBatch.batchNumber} flagged for wastage & quarantined.`);
      setShowReportModal(false);
      setSelectedBatchId('');
      setReportQty('');
      setReportCondition('');
      setReportNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit wastage report');
    } finally {
      setProcessing(false);
    }
  };

  const pendingVerificationList = useMemo(() => {
    return records.filter((r) => r.status === 'SUBMITTED');
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        (r.medicineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.reportedByName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const handleExportCsv = () => {
    const dataToExport = filteredRecords.map((r) => ({
      'Record ID': r.wastageId,
      'Medicine Name': r.medicineName,
      'Batch Number': r.batchNumber,
      'Quantity': r.quantity,
      'Loss ($)': Number(r.totalLoss || 0).toFixed(2),
      'Reason': r.reason,
      'Condition': r.physicalCondition,
      'Status': r.status,
      'Reported By': r.reportedByName,
      'Verified By': r.verifiedByName || 'Pending'
    }));
    exportToCsv(dataToExport, `Pharmacist_Wastage_Verification_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="admin-page-container">
      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '14px 22px',
          background: '#0d9488',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(13,148,136,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontWeight: 600,
          fontSize: '0.92rem'
        }}>
          <IconCheckCircle size={20} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="admin-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex',
              padding: 8,
              borderRadius: 12,
              background: '#ccfbf1',
              color: '#0d9488'
            }}>
              <IconAlertTriangle size={24} />
            </span>
            Clinical Wastage & Quarantine Verification
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Physically verify damaged and expired stock reported by hospital staff, enforce quarantine, and report dispensary write-offs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowReportModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 600,
              background: '#0d9488',
              borderColor: '#0d9488'
            }}
          >
            <IconPlus size={16} /> Report Wastage / Quarantine Batch
          </button>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconRefresh size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Section 1: Clinical Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #fed7aa'
        }}>
          <div style={{ color: '#c2410c', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Awaiting Physical Verification
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ea580c', marginTop: 8 }}>
            {pendingVerificationList.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Staff reports requiring pharmacist inspection
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #ccfbf1'
        }}>
          <div style={{ color: '#0f766e', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Verified & Escalated
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0d9488', marginTop: 8 }}>
            {records.filter((r) => r.status === 'VERIFIED').length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Forwarded for Admin final sign-off
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #dcfce7'
        }}>
          <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Officially Written Off
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginTop: 8 }}>
            {records.filter((r) => r.status === 'WRITTEN_OFF' || r.status === 'APPROVED').length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Approved by Admin & safely disposed
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #fee2e2'
        }}>
          <div style={{ color: '#991b1b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Total Quarantined Units
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626', marginTop: 8 }}>
            {records.reduce((acc, r) => acc + (r.status !== 'REJECTED' ? Number(r.quantity || 0) : 0), 0)}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Blocked from dispensing under FEFO rules
          </div>
        </div>
      </div>

      {/* Section 2: Physical Verification Queue */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
        border: '1px solid #fed7aa',
        marginBottom: 28
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex',
              padding: 6,
              borderRadius: 10,
              background: '#fff7ed',
              color: '#ea580c'
            }}>
              <IconShield size={20} />
            </span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Physical Inspection Queue (Staff Discrepancies)
            </h2>
            <span style={{
              background: '#ea580c',
              color: '#ffffff',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {pendingVerificationList.length} Action Needed
            </span>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Pharmacists must inspect physical batches before escalating to Admin for permanent write-off.
          </span>
        </div>

        {pendingVerificationList.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px 20px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            <IconCheckCircle size={32} style={{ color: '#0d9488', marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>Physical Inspection Queue Clear</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>No staff discrepancy reports pending clinical verification.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Batch & Medicine</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reported Qty</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reported By</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reason & Symptoms</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Clinical Verification</th>
                </tr>
              </thead>
              <tbody>
                {pendingVerificationList.map((item) => (
                  <tr key={item.wastageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.medicineName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Batch: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{item.batchNumber}</code></div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ea580c' }}>
                      {item.quantity} units
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.reportedByName}</div>
                      <div style={{ color: '#64748b' }}>{item.reportedRole} • {item.reportedAt ? new Date(item.reportedAt).toLocaleDateString() : 'N/A'}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: '#fff7ed',
                        color: '#c2410c',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {item.reason}
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4 }}>
                        {item.physicalCondition}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedRecord(item);
                          setVerifiedQty(String(item.quantity));
                          setVerificationNotes('');
                          setShowVerifyModal(true);
                        }}
                        style={{
                          background: '#0d9488',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 10,
                          padding: '7px 16px',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <IconCheck size={14} /> Verify & Pass to Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Wastage History & Write-off Register */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
        border: '1px solid #e2e8f0',
        marginBottom: 28
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Wastage & Quarantine Register
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
              Full log of all verified, quarantined, and authorized write-offs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 34px',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
              <span style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }}>
                <IconSearch size={15} />
              </span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#ffffff'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="WRITTEN_OFF">WRITTEN_OFF</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <button
              onClick={handleExportCsv}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '9px 14px', fontSize: '0.85rem', fontWeight: 600 }}
            >
              <IconDownload size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Batch #</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Medicine Name</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Category</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Qty</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reason</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Clinical Verification</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((r) => (
                <tr key={r.wastageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                      {r.batchNumber}
                    </code>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{r.medicineName}</td>
                  <td style={{ padding: '12px 14px', color: '#64748b' }}>{r.categoryName || 'General'}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: '#dc2626' }}>{r.quantity}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700
                    }}>
                      {r.reason}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{
                      background: r.status === 'WRITTEN_OFF' || r.status === 'APPROVED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fee2e2' : '#fef9c3',
                      color: r.status === 'WRITTEN_OFF' || r.status === 'APPROVED' ? '#15803d' : r.status === 'REJECTED' ? '#b91c1c' : '#a16207',
                      padding: '3px 8px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#475569' }}>
                    {r.verifiedByName ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f766e' }}>{r.verifiedByName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.verificationNotes || 'Verified'}</div>
                      </div>
                    ) : (
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>Unverified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f0fdfa'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f766e' }}>
                Verify Physical Wastage & Quarantine
              </h3>
              <button
                onClick={() => setShowVerifyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleVerify} style={{ padding: 24 }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem'
              }}>
                <div>Medicine: <strong>{selectedRecord.medicineName}</strong></div>
                <div>Batch Number: <code>{selectedRecord.batchNumber}</code></div>
                <div>Staff Reported Qty: <strong>{selectedRecord.quantity}</strong></div>
                <div>Reported Symptom: <em>"{selectedRecord.physicalCondition}"</em></div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Verified Physical Count: *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={verifiedQty}
                  onChange={(e) => setVerifiedQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Clinical Verification Findings & Quarantine Location:
                </label>
                <textarea
                  rows={3}
                  required
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="E.g. Inspected ampoules: 45 broken, glass fragments isolated in quarantine hazardous bin #2..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="confirmCondition"
                  checked={conditionConfirmed}
                  onChange={(e) => setConditionConfirmed(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#0d9488' }}
                />
                <label htmlFor="confirmCondition" style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
                  I certify I have physically inspected and quarantined this stock.
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '9px 16px',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    background: '#0d9488',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: processing ? 'wait' : 'pointer'
                  }}
                >
                  {processing ? 'Verifying...' : 'Submit Clinical Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Report Wastage Modal */}
      {showReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 540,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Initiate Clinical Quarantine & Wastage Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Select Inventory Batch: *
                </label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="">-- Choose batch to quarantine --</option>
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchNumber} — {b.medicineName} ({b.quantityAvailable} avail, exp: {b.expiryDate})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Quarantine Quantity: *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={reportQty}
                    onChange={(e) => setReportQty(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Wastage Reason: *
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="DAMAGED">DAMAGED</option>
                    <option value="CONTAMINATED">CONTAMINATED</option>
                    <option value="RECALLED">RECALLED</option>
                    <option value="STORAGE_FAILURE">STORAGE_FAILURE</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Physical Condition / Clinical Findings:
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Discolored suspension, broken safety cap..."
                  value={reportCondition}
                  onChange={(e) => setReportCondition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Pharmacist Notes & Recommended Disposal Method:
                </label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Enter notes regarding return to supplier or biohazard destruction..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    padding: '9px 16px',
                    fontWeight: 600,
                    color: '#475569'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  style={{
                    background: '#0d9488',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: processing ? 'wait' : 'pointer'
                  }}
                >
                  {processing ? 'Submitting...' : 'Quarantine Batch & Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

