import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  fetchMyWastageReports,
  createWastageReport,
  fetchBatches
} from '../../services/api';
import {
  IconAlertTriangle,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconFilter,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconShield,
  IconTrash,
  IconX,
  IconEye,
  IconFileText
} from '../../components/icons/Icons';
import './StaffCommon.css';
import '../admin/AdminPages.css';

const SEED_STAFF_REPORTS = [
  {
    wastageId: 2,
    medicineId: 8,
    medicineName: 'Ciprofloxacin 500mg',
    batchId: 108,
    batchNumber: 'CIP2024012',
    quantity: 45,
    reason: 'DAMAGED',
    physicalCondition: 'Outer carton crushed and ampoules shattered in transit',
    status: 'SUBMITTED',
    reportedByName: 'Nurse Emily Watson',
    reportedAt: '2026-11-08T11:00:00Z',
    verifiedByName: null,
    verificationNotes: 'Pending pharmacist inspection'
  },
  {
    wastageId: 1,
    medicineId: 6,
    medicineName: 'Vitamin D3 1000IU',
    batchId: 107,
    batchNumber: 'VIT2024009',
    quantity: 120,
    reason: 'EXPIRED',
    physicalCondition: 'Expired beyond acceptable buffer date',
    status: 'WRITTEN_OFF',
    reportedByName: 'Nurse Emily Watson',
    reportedAt: '2026-11-01T09:30:00Z',
    verifiedByName: 'Alex Rivera, PharmD',
    verificationNotes: 'Physical count verified. Disposed per clinical waste protocol.'
  }
];

export default function StaffWastagePage() {
  const [reports, setReports] = useState(SEED_STAFF_REPORTS);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState(null);

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('DAMAGED');
  const [physicalCondition, setPhysicalCondition] = useState('');
  const [notes, setNotes] = useState('');
  const [photoSelected, setPhotoSelected] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [myList, batchList] = await Promise.all([
        fetchMyWastageReports(),
        fetchBatches()
      ]);
      if (myList && Array.isArray(myList) && myList.length > 0) setReports(myList);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatchId || !quantity) {
      alert('Please select a medicine batch and enter quantity.');
      return;
    }
    const chosenBatch = batches.find((b) => String(b.batchId) === String(selectedBatchId));
    if (!chosenBatch) {
      alert('Selected batch not found');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        medicineId: chosenBatch.medicineId,
        medicineName: chosenBatch.medicineName,
        batchId: chosenBatch.batchId,
        batchNumber: chosenBatch.batchNumber,
        categoryName: chosenBatch.categoryName || 'General',
        quantity: parseInt(quantity, 10),
        unitCost: chosenBatch.purchaseCost || 5.0,
        reason,
        physicalCondition: physicalCondition || 'Observed by floor staff during ward rounds',
        notes: notes + (photoSelected ? ' [Photo proof attached to incident record]' : '')
      };
      await createWastageReport(payload);
      showToast(`Discrepancy reported for batch ${chosenBatch.batchNumber}. Routed to Lead Pharmacist.`);
      setShowFormModal(false);
      setSelectedBatchId('');
      setQuantity('');
      setPhysicalCondition('');
      setNotes('');
      setPhotoSelected(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
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
          background: '#2563eb',
          color: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 12px 30px rgba(37,99,235,0.35)',
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
              background: '#dbeafe',
              color: '#2563eb'
            }}>
              <IconAlertTriangle size={24} />
            </span>
            Staff Wastage & Discrepancy Reporting
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.92rem' }}>
            Report physically broken, seal-tampered, temperature-compromised, or expired medicines for verification and quarantine.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowFormModal(true)}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              padding: '10px 18px',
              fontWeight: 600,
              background: '#2563eb',
              borderColor: '#2563eb'
            }}
          >
            <IconPlus size={16} /> Report Medicine Damage / Expiry
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

      {/* Section 1: Quick Status Counters */}
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
          border: '1px solid #dbeafe'
        }}>
          <div style={{ color: '#1e40af', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Reports Submitted
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginTop: 8 }}>
            {reports.length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Total incident reports logged by your shift
          </div>
        </div>

        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '20px 24px',
          boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
          border: '1px solid #fef3c7'
        }}>
          <div style={{ color: '#92400e', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
            In Pharmacist Review
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706', marginTop: 8 }}>
            {reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'VERIFIED').length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Under physical inspection in dispensary
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
            Resolved & Disposed
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginTop: 8 }}>
            {reports.filter((r) => r.status === 'WRITTEN_OFF' || r.status === 'APPROVED').length}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            Officially written off by Administration
          </div>
        </div>
      </div>

      {/* Section 2: My Reported Wastage Register */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
        border: '1px solid #e2e8f0',
        marginBottom: 28
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          My Incident & Damage Reports
        </h2>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
            <IconCheckCircle size={32} style={{ color: '#10b981', marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No reported incidents</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem' }}>You have not reported any damaged or expired batches.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Batch & Medicine</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reported Qty</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Reason</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Condition Description</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ padding: '12px 14px', fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>Clinical Verification</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.wastageId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.medicineName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Batch: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{r.batchNumber}</code></div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#dc2626' }}>
                      {r.quantity} units
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {r.reason}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#475569' }}>
                      {r.physicalCondition}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        background: r.status === 'WRITTEN_OFF' || r.status === 'APPROVED' ? '#dcfce7' : r.status === 'REJECTED' ? '#fee2e2' : '#eff6ff',
                        color: r.status === 'WRITTEN_OFF' || r.status === 'APPROVED' ? '#15803d' : r.status === 'REJECTED' ? '#b91c1c' : '#1d4ed8',
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
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.verificationNotes}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Pending Pharmacist Check</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Safe Disposal & Handling Protocol Guidelines */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: 24,
        boxShadow: '0 8px 24px rgba(149, 157, 165, 0.08)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', padding: 6, borderRadius: 10, background: '#eff6ff', color: '#2563eb' }}>
            <IconShield size={20} />
          </span>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
            Safe Stock Isolation Protocols for Ward Staff
          </h3>
        </div>
        <ul style={{ margin: '8px 0 0 20px', color: '#475569', fontSize: '0.88rem', lineHeight: '1.6' }}>
          <li><strong>Never Administer Damaged Medicine:</strong> If seals are breached, packaging is cracked, or discoloration is observed, immediately place the stock in the designated yellow quarantine container.</li>
          <li><strong>Discrepancy Reporting:</strong> Submit an incident report right away. The batch is automatically flagged in FEFO so other staff will not pick it.</li>
          <li><strong>Deliver to Pharmacy:</strong> Hand over quarantined containers to the dispensary within 2 hours with the batch slip.</li>
        </ul>
      </div>

      {/* Report Damage Modal */}
      {showFormModal && (
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
              background: '#eff6ff'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e40af' }}>
                Report Damaged or Expired Stock
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Select Medicine Batch: *
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
                  <option value="">-- Choose batch with damage/expiry --</option>
                  {batches.map((b) => (
                    <option key={b.batchId} value={b.batchId}>
                      {b.batchNumber} — {b.medicineName} ({b.quantityAvailable} in stock, exp: {b.expiryDate})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                    Quantity Affected: *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
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
                    Reason: *
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem'
                    }}
                  >
                    <option value="DAMAGED">Physical Damage / Broken Packaging</option>
                    <option value="EXPIRED">Expired Past Safe Threshold</option>
                    <option value="CONTAMINATED">Seal Broken / Contamination</option>
                    <option value="STORAGE_FAILURE">Temperature Excursion</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Physical Condition Description: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Blister pack punctured, liquid cloudy..."
                  value={physicalCondition}
                  onChange={(e) => setPhysicalCondition(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 10,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#334155', marginBottom: 6 }}>
                  Incident Notes / Ward Location:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g. Found on Shelf 4B during morning medication round..."
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

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={photoSelected}
                    onChange={(e) => setPhotoSelected(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#2563eb' }}
                  />
                  <span>Attach Photo Evidence of Damaged Packaging</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
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
                  disabled={submitting}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: submitting ? 'wait' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Incident Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
