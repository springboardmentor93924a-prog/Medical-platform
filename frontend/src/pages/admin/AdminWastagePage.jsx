import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchWastageRecords,
  fetchPendingWastageApprovals,
  fetchWastageAnalytics,
  approveWastageReport
} from '../../services/api';
import {
  IconAlertTriangle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconDownload,
  IconFilter,
  IconPackage,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrash,
  IconX,
  IconEye,
  IconFileText
} from '../../components/icons/Icons';
import { exportToCsv } from '../../utils/csvExport';
import './AdminPages.css';

const SEED_WASTAGE = [
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
    verificationNotes: 'Physical count verified. Shelf life exhausted.',
    approvedByName: 'Dr. Sarah Khan',
    approvedAt: '2026-11-02T10:00:00Z',
    approvalNotes: 'Authorized batch disposal under hazardous medical waste protocols.',
    disposalMethod: 'INCINERATION'
  },
  {
    wastageId: 2,
    medicineId: 8,
    medicineCode: 'MED008',
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
    status: 'PENDING_APPROVAL',
    reportedByName: 'Nurse Emily Watson',
    reportedRole: 'STAFF',
    reportedAt: '2026-11-08T11:00:00Z',
    verifiedByName: 'Alex Rivera, PharmD',
    verifiedAt: '2026-11-08T15:30:00Z',
    verificationNotes: 'Goods in inspection verified breakage. Supplier claim submitted.',
    approvedByName: null,
    approvedAt: null,
    approvalNotes: null,
    disposalMethod: 'RETURN_TO_SUPPLIER'
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
    verificationNotes: 'Quarantined immediately to prevent cross contamination.',
    approvedByName: null,
    approvedAt: null,
    approvalNotes: null,
    disposalMethod: 'BIOHAZARD_DISPOSAL'
  }
];

export default function AdminWastagePage() {
  const [records, setRecords] = useState(SEED_WASTAGE);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reasonFilter, setReasonFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'VIEW', 'APPROVE', 'REJECT'
  const [decisionNotes, setDecisionNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recs, pends, anlys] = await Promise.all([
        fetchWastageRecords(),
        fetchPendingWastageApprovals(),
        fetchWastageAnalytics()
      ]);
      if (recs && Array.isArray(recs)) setRecords(recs);
      if (pends && Array.isArray(pends)) setPendingApprovals(pends);
      if (anlys) setAnalytics(anlys);
    } catch (_e) {
      // Retain fallback data if network failure
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

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        (r.medicineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.batchNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.reportedByName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchReason = reasonFilter === 'ALL' || r.reason === reasonFilter;
      return matchSearch && matchStatus && matchReason;
    });
  }, [records, searchTerm, statusFilter, reasonFilter]);

  const handleDecision = async (action) => {
    if (!selectedRecord) return;
    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please provide a mandatory reason for rejection.');
      return;
    }
    setProcessing(true);
    try {
      const payload = {
        action,
        notes: decisionNotes,
        rejectionReason: action === 'REJECT' ? rejectionReason : null
      };
      const res = await approveWastageReport(selectedRecord.wastageId, payload);
      showToast(action === 'APPROVE'
        ? `Wastage write-off approved for batch ${selectedRecord.batchNumber}. Stock permanently deducted.`
        : `Wastage report for batch ${selectedRecord.batchNumber} rejected. Quarantined units released.`
      );
      setModalMode(null);
      setSelectedRecord(null);
      setDecisionNotes('');
      setRejectionReason('');
      loadData();
    } catch (e) {
      alert(e.message || 'Error processing approval');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportCsv = () => {
    const dataToExport = filteredRecords.map((r) => ({
      'Record ID': r.wastageId,
      'Medicine Name': r.medicineName,
      'Batch Number': r.batchNumber,
      'Quantity': r.quantity,
      'Unit Cost ($)': Number(r.unitCost || 0).toFixed(2),
      'Total Loss ($)': Number(r.totalLoss || 0).toFixed(2),
      'Supplier Recovery ($)': Number(r.supplierRecovery || 0).toFixed(2),
      'Net Loss ($)': Number(r.netLoss || 0).toFixed(2),
      'Reason': r.reason,
      'Status': r.status,
      'Reported By': r.reportedByName,
      'Reported At': r.reportedAt ? new Date(r.reportedAt).toLocaleDateString() : 'N/A',
      'Verified By': r.verifiedByName || 'N/A',
      'Approved By': r.approvedByName || 'N/A'
    }));
    exportToCsv(dataToExport, `MediStock_Admin_Wastage_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // KPI calculations
  const totalWastageLoss = useMemo(() => {
    return records.reduce((acc, r) => acc + (Number(r.totalLoss) || 0), 0);
  }, [records]);

  const totalSupplierRecovery = useMemo(() => {
    return records.reduce((acc, r) => acc + (Number(r.supplierRecovery) || 0), 0);
  }, [records]);

  const netFinancialLoss = totalWastageLoss - totalSupplierRecovery;

  const writtenOffCount = useMemo(() => {
    return records.filter((r) => r.status === 'WRITTEN_OFF' || r.status === 'APPROVED').length;
  }, [records]);

  const pendingCount = pendingApprovals.length;

  return (
    <div className="admin-page-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          padding: '14px 22px',
          background: '#047857',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(4,120,87,0.35)',
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
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              color: '#dc2626'
            }}>
              <IconAlertTriangle size={24} />
            </span>
            Wastage & Loss Management
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            System-wide physical write-offs, financial loss monitoring, supplier recoveries & multi-tier audit approvals.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600 }}
          >
            <IconRefresh size={16} /> Refresh
          </button>
          <button
            onClick={handleExportCsv}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, padding: '10px 18px', fontWeight: 600, background: '#dc2626', borderColor: '#dc2626' }}
          >
            <IconDownload size={16} /> Export Audit Report (CSV)
          </button>
        </div>
      </div>

      {/* Section 1: Executive KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
          border: '1px solid #fee2e2',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ color: '#991b1b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Wastage Cost
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#dc2626', marginTop: 8 }}>
            ${totalWastageLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Gross inventory loss before supplier credits
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
          border: '1px solid #dcfce7'
        }}>
          <div style={{ color: '#166534', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Supplier Recoveries
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#16a34a', marginTop: 8 }}>
            ${totalSupplierRecovery.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Recovered via vendor credit notes & returns
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Net Financial Loss
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#0f172a', marginTop: 8 }}>
            ${netFinancialLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Actual unrecoverable financial impact
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
          border: '1px solid #fef3c7'
        }}>
          <div style={{ color: '#92400e', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Admin Approvals
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#d97706', marginTop: 8 }}>
            {pendingCount}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Awaiting executive sign-off for ledger write-off
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Written-Off Batches
          </div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#334155', marginTop: 8 }}>
            {writtenOffCount}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Completed disposals and balance removals
          </div>
        </div>
      </div>

      {/* Section 2: Pending Approvals Queue (Admin Action Required) */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
        border: '1px solid #fee2e2',
        marginBottom: 28
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex',
              padding: 6,
              borderRadius: 10,
              background: '#fef2f2',
              color: '#dc2626'
            }}>
              <IconShield size={20} />
            </span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Pending Executive Write-Off Approvals
            </h2>
            <span style={{
              background: pendingCount > 0 ? '#ef4444' : '#10b981',
              color: '#ffffff',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {pendingCount} Pending
            </span>
          </div>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Approving writes off stock atomically & records ledger audit log.
          </span>
        </div>

        {pendingApprovals.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '36px 20px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px dashed #cbd5e1',
            color: '#64748b'
          }}>
            <IconCheckCircle size={32} style={{ color: '#10b981', marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 600, color: '#1e293b' }}>No pending write-off approvals</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>All verified clinical wastage reports have been processed.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Batch & Medicine</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Qty to Deduct</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Unit Cost</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Financial Loss</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reason</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reported & Verified By</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map((p) => (
                  <tr key={p.wastageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.medicineName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Batch: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{p.batchNumber}</code></div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#dc2626' }}>
                      {p.quantity} units
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>
                      ${Number(p.unitCost || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#dc2626' }}>
                      ${Number(p.totalLoss || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '3px 8px',
                        borderRadius: 8,
                        fontSize: '0.74rem',
                        fontWeight: 700
                      }}>
                        {p.reason}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                      <div><span style={{ color: '#64748b' }}>Reported:</span> {p.reportedByName}</div>
                      <div><span style={{ color: '#64748b' }}>Verified:</span> {p.verifiedByName || 'Pending verification'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            setSelectedRecord(p);
                            setModalMode('APPROVE');
                          }}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 10,
                            padding: '6px 14px',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          Approve Write-Off
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRecord(p);
                            setModalMode('REJECT');
                          }}
                          style={{
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                            borderRadius: 10,
                            padding: '6px 12px',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            cursor: 'pointer'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: All Wastage & Disposal Audit Records */}
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
              Historical Wastage & Write-Off Register
            </h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.84rem' }}>
              Complete regulatory audit trail of all discarded, expired, damaged, and quarantined items.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <input
                type="text"
                placeholder="Search medicine or batch..."
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
                background: '#ffffff',
                color: '#334155'
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
              <option value="APPROVED">APPROVED / WRITTEN OFF</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                background: '#ffffff',
                color: '#334155'
              }}
            >
              <option value="ALL">All Reasons</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="DAMAGED">DAMAGED</option>
              <option value="CONTAMINATED">CONTAMINATED</option>
              <option value="RECALLED">RECALLED</option>
              <option value="STORAGE_FAILURE">STORAGE_FAILURE</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>ID</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Medicine Name</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Batch Number</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Qty</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Unit Cost</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Total Loss</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Supplier Recovery</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reason</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 28, textAlign: 'center', color: '#94a3b8' }}>
                    No wastage records match current filters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.wastageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>#{r.wastageId}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>{r.medicineName}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 6, fontSize: '0.82rem' }}>
                        {r.batchNumber}
                      </code>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#dc2626' }}>{r.quantity}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>${Number(r.unitCost || 0).toFixed(2)}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#dc2626' }}>
                      ${Number(r.totalLoss || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: 600 }}>
                      ${Number(r.supplierRecovery || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '3px 8px',
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
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedRecord(r);
                          setModalMode('VIEW');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontWeight: 600,
                          fontSize: '0.82rem'
                        }}
                      >
                        <IconEye size={15} /> Audit Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4 & 5: AI Wastage Intelligence & Root Cause Loss Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: 24,
        marginBottom: 28
      }}>
        {/* Section 4: AI Wastage Risk Intelligence */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex',
              padding: 6,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb'
            }}>
              <IconShield size={20} />
            </span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              AI Wastage Risk Prediction
            </h2>
          </div>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.85rem' }}>
            Machine-learning indicators highlighting slow-moving batches approaching critical expiry horizons.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 14,
              borderRadius: 14,
              background: '#fff1f2',
              border: '1px solid #fecdd3',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.9rem' }}>High Expiry Risk: CIP2024012</div>
                <div style={{ fontSize: '0.78rem', color: '#e11d48' }}>95 units remaining • Expiring in 28 days • Low turnover</div>
              </div>
              <span style={{ background: '#be123c', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                CRITICAL
              </span>
            </div>

            <div style={{
              padding: 14,
              borderRadius: 14,
              background: '#fefce8',
              border: '1px solid #fef08a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#854d0e', fontSize: '0.9rem' }}>Medium Risk: MET2024008</div>
                <div style={{ fontSize: '0.78rem', color: '#a16207' }}>320 units • Shelf life 45 days • Recommend FEFO priority override</div>
              </div>
              <span style={{ background: '#eab308', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                WARNING
              </span>
            </div>

            <div style={{
              padding: 14,
              borderRadius: 14,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>FEFO Loss Prevention Saved</div>
                <div style={{ fontSize: '0.78rem', color: '#15803d' }}>Auto-prioritization avoided an estimated $4,280 in potential wastage</div>
              </div>
              <span style={{ background: '#16a34a', color: '#fff', padding: '4px 8px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                OPTIMIZED
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Root Cause & Supplier Claim Recovery */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{
              display: 'inline-flex',
              padding: 6,
              borderRadius: 10,
              background: '#fdf2f8',
              color: '#db2777'
            }}>
              <IconFileText size={20} />
            </span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Loss Attribution & Supplier Recovery
            </h2>
          </div>
          <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.85rem' }}>
            Financial loss grouped by root incident and claims status against pharmaceutical suppliers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Expired Stock Write-offs</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>$1,080.00 (57.7%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Damaged in Transit / Storage</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>$630.00 (33.7%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#475569', fontWeight: 600 }}>Contaminated / Seal Broken</span>
              <span style={{ fontWeight: 700, color: '#dc2626' }}>$160.00 (8.6%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#16a34a', fontWeight: 700 }}>Total Supplier Reimbursed</span>
              <span style={{ fontWeight: 800, color: '#16a34a' }}>-$500.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              <span>Net Write-Off Balance</span>
              <span style={{ color: '#dc2626' }}>${netFinancialLoss.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal (Approve / Reject / View Audit) */}
      {modalMode && selectedRecord && (
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
            maxWidth: 580,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: modalMode === 'APPROVE' ? '#f0fdf4' : modalMode === 'REJECT' ? '#fef2f2' : '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: '#0f172a' }}>
                {modalMode === 'APPROVE' && 'Confirm Batch Write-Off & Stock Deduction'}
                {modalMode === 'REJECT' && 'Reject Wastage Report'}
                {modalMode === 'VIEW' && 'Wastage Audit Trail & Regulatory Chain'}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{
                background: '#f8fafc',
                borderRadius: 14,
                padding: 16,
                marginBottom: 20,
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                fontSize: '0.88rem'
              }}>
                <div><span style={{ color: '#64748b' }}>Medicine:</span> <strong>{selectedRecord.medicineName}</strong></div>
                <div><span style={{ color: '#64748b' }}>Batch #:</span> <code>{selectedRecord.batchNumber}</code></div>
                <div><span style={{ color: '#64748b' }}>Quantity:</span> <strong style={{ color: '#dc2626' }}>{selectedRecord.quantity} units</strong></div>
                <div><span style={{ color: '#64748b' }}>Estimated Loss:</span> <strong style={{ color: '#dc2626' }}>${Number(selectedRecord.totalLoss || 0).toFixed(2)}</strong></div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b' }}>Reason:</span> <strong>{selectedRecord.reason}</strong>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 4 }}>{selectedRecord.physicalCondition}</div>
                </div>
              </div>

              {/* Multi-Tier Chain Information */}
              <div style={{ marginBottom: 20, fontSize: '0.84rem', color: '#334155' }}>
                <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, marginBottom: 6 }}>
                  <strong>Reported By:</strong> {selectedRecord.reportedByName} ({selectedRecord.reportedRole || 'Staff'}) at {selectedRecord.reportedAt ? new Date(selectedRecord.reportedAt).toLocaleString() : 'N/A'}
                </div>
                {selectedRecord.verifiedByName && (
                  <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 8, marginBottom: 6 }}>
                    <strong>Clinically Verified By:</strong> {selectedRecord.verifiedByName} (Pharmacist)
                    <div style={{ fontStyle: 'italic', color: '#1e40af', marginTop: 2 }}>"{selectedRecord.verificationNotes || 'Verified'}"</div>
                  </div>
                )}
                {selectedRecord.approvedByName && (
                  <div style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: 8 }}>
                    <strong>Approved Write-Off By:</strong> {selectedRecord.approvedByName} (Administrator)
                    <div style={{ fontStyle: 'italic', color: '#065f46', marginTop: 2 }}>"{selectedRecord.approvalNotes || 'Authorized'}"</div>
                  </div>
                )}
              </div>

              {modalMode === 'APPROVE' && (
                <div>
                  <div style={{
                    padding: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    color: '#991b1b',
                    fontSize: '0.82rem',
                    marginBottom: 16
                  }}>
                    <strong>Notice:</strong> Approving this record will permanently deduct <strong>{selectedRecord.quantity} units</strong> from batch <strong>{selectedRecord.batchNumber}</strong>, record an irrevocable stock log, and post to the financial loss ledger.
                  </div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Approval / Disposal Notes:
                  </label>
                  <textarea
                    rows={3}
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="Enter disposal protocol, incineration cert #, or write-off authorization details..."
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      resize: 'none'
                    }}
                  />
                </div>
              )}

              {modalMode === 'REJECT' && (
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#991b1b', marginBottom: 6 }}>
                    Mandatory Rejection Reason: *
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Specify why the write-off is rejected (e.g. batch can be reconditioned, inspection failed, unverified quantity)..."
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 10,
                      border: '1px solid #f87171',
                      fontSize: '0.85rem',
                      resize: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 6 }}>
                    Rejecting will un-quarantine the batch and restore available dispensing status.
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setModalMode(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '9px 18px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                {modalMode === 'VIEW' ? 'Close' : 'Cancel'}
              </button>

              {modalMode === 'APPROVE' && (
                <button
                  disabled={processing}
                  onClick={() => handleDecision('APPROVE')}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: processing ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                  }}
                >
                  {processing ? 'Processing...' : 'Confirm Permanent Write-Off'}
                </button>
              )}

              {modalMode === 'REJECT' && (
                <button
                  disabled={processing}
                  onClick={() => handleDecision('REJECT')}
                  style={{
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: processing ? 'wait' : 'pointer',
                    boxShadow: '0 4px 12px rgba(220,38,38,0.3)'
                  }}
                >
                  {processing ? 'Processing...' : 'Confirm Rejection'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

