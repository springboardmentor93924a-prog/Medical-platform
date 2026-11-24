import React, { useState } from 'react';
import {
  IconCheckCircle,
  IconAlertTriangle,
  IconBox,
  IconSearch,
  IconClock,
  IconCheck,
  IconX
} from '../icons/Icons';
import { getDaysRemaining } from './fefoUtils';

export default function FefoPickingInstructions({
  batches = [],
  onReportDiscrepancy
}) {
  const [filterMed, setFilterMed] = useState('');
  const [verifiedBatches, setVerifiedBatches] = useState({});
  const [discrepancyModalBatch, setDiscrepancyModalBatch] = useState(null);
  const [discrepancyType, setDiscrepancyType] = useState('COUNT_MISMATCH');
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Group batches by medicine and pick the earliest expiring eligible batch
  const filtered = batches.filter((b) => {
    if (!filterMed) return true;
    const query = filterMed.toLowerCase();
    return (
      (b.medicineName && b.medicineName.toLowerCase().includes(query)) ||
      (b.batchNumber && b.batchNumber.toLowerCase().includes(query))
    );
  });

  const handleVerifyBatch = (batchId) => {
    setVerifiedBatches((prev) => ({
      ...prev,
      [batchId]: !prev[batchId]
    }));
  };

  const handleConfirmDiscrepancy = (e) => {
    e.preventDefault();
    if (!discrepancyModalBatch) return;

    if (onReportDiscrepancy) {
      onReportDiscrepancy({
        batchId: discrepancyModalBatch.batchId || discrepancyModalBatch.id,
        batchNumber: discrepancyModalBatch.batchNumber,
        medicineName: discrepancyModalBatch.medicineName,
        type: discrepancyType,
        notes: discrepancyNotes,
        reportedAt: new Date().toISOString()
      });
    }

    setToastMsg(`Discrepancy recorded for Batch ${discrepancyModalBatch.batchNumber}. Pharmacy lead notified.`);
    setDiscrepancyModalBatch(null);
    setDiscrepancyNotes('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div>
      {toastMsg && (
        <div style={{ background: '#0F4A47', color: '#ffffff', padding: '12px 18px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <IconCheckCircle size={18} color="#34D399" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Inset Instructions Bar */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)', border: '1px solid #99f6e4', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f766e', fontWeight: 700 }}>
          Staff FEFO Picking Protocol (First Expiry, First Out)
        </h4>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: '#334155' }}>
          Always pick stock from <strong>Priority 1 (Earliest Expiry)</strong> batches highlighted below. Verify physical batch labels against the shelf location before dispensing or transport.
        </p>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Filter picking list by medicine name or batch number..."
          value={filterMed}
          onChange={(e) => setFilterMed(e.target.value)}
          className="clay-form-input"
          style={{ width: '100%', maxWidth: 400 }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map((b) => {
          const days = getDaysRemaining(b.expiryDate);
          const isPriority1 = b.fefoRecommendation === 'Use first' || b.fefoRank === 1;
          const isVerified = verifiedBatches[b.batchId || b.id];

          return (
            <div
              key={b.batchId || b.id}
              style={{
                background: '#ffffff',
                border: isPriority1 ? '2px solid #008C8C' : '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 18,
                boxShadow: isPriority1 ? '0 6px 20px rgba(0, 140, 140, 0.12)' : '0 2px 8px rgba(0,0,0,0.03)',
                position: 'relative'
              }}
            >
              {isPriority1 && (
                <div style={{ position: 'absolute', top: -10, right: 16, background: '#008C8C', color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20 }}>
                  ★ PICK FIRST (FEFO)
                </div>
              )}

              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#16324F', marginBottom: 4 }}>
                {b.medicineName}
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', marginBottom: 12 }}>
                Batch: <strong style={{ color: '#008C8C', fontFamily: 'monospace' }}>{b.batchNumber}</strong>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', fontSize: '0.82rem', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Shelf Location:</span>
                  <strong>{b.shelfLocation || b.storageLocation || 'Aisle 2, Bin C'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Expiry Date:</span>
                  <strong style={{ color: days <= 30 ? '#dc2626' : '#16324f' }}>
                    {b.expiryDate} ({days}d left)
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Available Stock:</span>
                  <strong style={{ color: '#16a34a' }}>{b.quantityAvailable ?? 0} units</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handleVerifyBatch(b.batchId || b.id)}
                  className={`clay-action-pill-btn ${isVerified ? 'clay-action-pill-btn--primary' : 'clay-action-pill-btn--secondary'}`}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {isVerified ? (
                    <>
                      <IconCheck size={14} style={{ marginRight: 4 }} /> Verified
                    </>
                  ) : (
                    'Verify Batch'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setDiscrepancyModalBatch(b)}
                  className="clay-action-pill-btn clay-action-pill-btn--secondary"
                  style={{ color: '#ea580c', borderColor: '#fed7aa' }}
                >
                  Report
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Discrepancy Modal */}
      {discrepancyModalBatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconAlertTriangle size={18} /> Report Stock Discrepancy
              </h4>
              <button onClick={() => setDiscrepancyModalBatch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <IconX size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: '#475569' }}>
              Reporting issue for <strong>{discrepancyModalBatch.medicineName}</strong> (Batch: {discrepancyModalBatch.batchNumber}).
            </p>

            <form onSubmit={handleConfirmDiscrepancy}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Discrepancy Type *
                </label>
                <select
                  value={discrepancyType}
                  onChange={(e) => setDiscrepancyType(e.target.value)}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                >
                  <option value="COUNT_MISMATCH">Physical Count Mismatch</option>
                  <option value="DAMAGED_PACKAGING">Damaged Packaging / Seal Breach</option>
                  <option value="EXPIRED_FOUND">Expired Unit on Shelf</option>
                  <option value="LABEL_DEFECT">Illegible Label or Barcode</option>
                </select>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Inspection Notes & Details *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail observed issue (e.g. 10 units counted instead of 15; crushed blister pack)..."
                  value={discrepancyNotes}
                  onChange={(e) => setDiscrepancyNotes(e.target.value)}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setDiscrepancyModalBatch(null)}
                  className="clay-action-pill-btn clay-action-pill-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-action-pill-btn clay-action-pill-btn--primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                >
                  Submit Discrepancy Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

