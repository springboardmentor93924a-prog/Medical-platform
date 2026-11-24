import React, { useState, useEffect } from 'react';
import {
  IconCheck,
  IconAlertTriangle,
  IconArrowRight,
  IconClock,
  IconShield,
  IconX
} from '../icons/Icons';
import { fetchFefoRecommendation, allocateFefoStock } from '../../services/api';

export default function FefoAllocationCalculator({
  medicines = [],
  initialMedicineId = null,
  initialBatch = null,
  onAllocationComplete,
  onClose
}) {
  const [selectedMedId, setSelectedMedId] = useState(initialMedicineId || (medicines[0]?.medicineId || medicines[0]?.id || ''));
  const [requestedQty, setRequestedQty] = useState(10);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [chosenBatchId, setChosenBatchId] = useState(initialBatch ? initialBatch.batchId : null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Load FEFO recommendation whenever medicine, quantity or chosen batch changes
  useEffect(() => {
    if (!selectedMedId) return;
    let isCurrent = true;
    setLoading(true);
    setErrorMsg(null);

    fetchFefoRecommendation(selectedMedId, requestedQty, chosenBatchId)
      .then((data) => {
        if (isCurrent && data) {
          setRecommendation(data);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.warn('Recommendation fallback', err);
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => { isCurrent = false; };
  }, [selectedMedId, requestedQty, chosenBatchId]);

  const handleExecuteAllocation = async (e) => {
    e.preventDefault();
    if (!selectedMedId || requestedQty <= 0) {
      setErrorMsg('Please enter a valid requested quantity.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        medicineId: parseInt(selectedMedId, 10),
        requestedQuantity: parseInt(requestedQty, 10),
        selectedBatchId: chosenBatchId ? parseInt(chosenBatchId, 10) : null,
        overrideReason: overrideReason || null,
        referenceType: 'PRESCRIPTION_DISPENSING',
        notes: 'Clinical FEFO stock dispensation'
      };

      const result = await allocateFefoStock(payload);
      setSuccessMsg('Stock successfully allocated and deducted under First Expiry, First Out rule!');
      if (onAllocationComplete) {
        onAllocationComplete(result);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#16324F', fontWeight: 700 }}>
            FEFO Stock Allocation Calculator
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
            First Expiry, First Out automated allocation and dispensing validation.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <IconX size={20} />
          </button>
        )}
      </div>

      {errorMsg && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: '0.86rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '10px 14px', borderRadius: 8, fontSize: '0.86rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconCheck size={16} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleExecuteAllocation}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Select Medicine *
            </label>
            <select
              value={selectedMedId}
              onChange={(e) => {
                setSelectedMedId(e.target.value);
                setChosenBatchId(null);
              }}
              className="clay-form-input"
              style={{ width: '100%' }}
              required
            >
              {medicines.map((m) => (
                <option key={m.medicineId || m.id} value={m.medicineId || m.id}>
                  {m.medicineName || m.name} ({m.medicineCode || m.code || 'MED'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Requested Dispensing Units *
            </label>
            <input
              type="number"
              min="1"
              value={requestedQty}
              onChange={(e) => setRequestedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="clay-form-input"
              style={{ width: '100%' }}
              required
            />
          </div>
        </div>

        {/* FEFO Automated Allocation Plan Preview */}
        {recommendation && (
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f766e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconShield size={16} /> FEFO Recommended Allocation Plan
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Total Available: <strong>{recommendation.totalAvailableQuantity ?? 0} units</strong>
              </span>
            </div>

            {recommendation.allocationPlan && recommendation.allocationPlan.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendation.allocationPlan.map((plan, idx) => (
                  <div
                    key={plan.batchId || idx}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.75rem', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>
                        Pick #{idx + 1}
                      </span>
                      <strong style={{ color: '#008C8C' }}>Batch {plan.batchNumber}</strong>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 8 }}>
                        (Expires: {plan.expiryDate})
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: '#16a34a' }}>
                        Deduct: {plan.quantityToAllocate} units
                      </span>
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Remaining: {plan.quantityAvailable - plan.quantityToAllocate} units
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626' }}>
                Insufficient eligible stock available to satisfy requested quantity.
              </p>
            )}
          </div>
        )}

        {/* Optional Manual Batch Selection with Override Logging */}
        {recommendation?.allEligibleBatches && recommendation.allEligibleBatches.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
              Batch Override Selection (Optional)
            </label>
            <select
              value={chosenBatchId || ''}
              onChange={(e) => setChosenBatchId(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="clay-form-input"
              style={{ width: '100%', marginBottom: 10 }}
            >
              <option value="">-- Use System Recommended FEFO Plan (Default) --</option>
              {recommendation.allEligibleBatches.map((b) => (
                <option key={b.batchId} value={b.batchId}>
                  Batch {b.batchNumber} (Expires: {b.expiryDate}, Avail: {b.quantityAvailable})
                </option>
              ))}
            </select>

            {chosenBatchId && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#b45309', marginBottom: 4 }}>
                  Mandatory FEFO Override Reason *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prescriber requested specific manufacturer formulation"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="clay-action-pill-btn clay-action-pill-btn--secondary"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || loading || !recommendation?.canFulfillEntirely}
            className="clay-action-pill-btn clay-action-pill-btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {submitting ? 'Confirming...' : 'Confirm Stock Allocation'} <IconArrowRight size={15} />
          </button>
        </div>
      </form>
    </div>
  );
}

