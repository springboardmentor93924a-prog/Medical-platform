import React, { useState } from 'react';
import {
  IconTrash,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconDownload,
  IconPlus
} from '../icons/Icons';
import { formatCurrency } from './fefoUtils';
import { exportToCsv } from '../../utils/csvExport';

const INITIAL_WASTAGE_LOGS = [
  {
    id: 1,
    medicineName: 'Vitamin D3 1000IU',
    batchNumber: 'VIT2024009',
    quantityWrittenOff: 150,
    unitCost: 15.40,
    financialLoss: 2310.00,
    reason: 'Expired on shelf past manufacturer specification',
    disposalStatus: 'Incineration Certificate Issued',
    disposedBy: 'Dr. Sarah Khan',
    timestamp: '2026-11-02 11:30'
  },
  {
    id: 2,
    medicineName: 'Amoxicillin 250mg',
    batchNumber: 'AMX2024001',
    quantityWrittenOff: 40,
    unitCost: 12.50,
    financialLoss: 500.00,
    reason: 'Cold chain temperature excursion (> 15°C breach)',
    disposalStatus: 'Hazardous Chemical Neutralization',
    disposedBy: 'Alex Rivera, PharmD',
    timestamp: '2026-10-28 14:15'
  },
  {
    id: 3,
    medicineName: 'Salbutamol Inhaler 100mcg',
    batchNumber: 'SLB2024003',
    quantityWrittenOff: 12,
    unitCost: 230.00,
    financialLoss: 2760.00,
    reason: 'Broken actuator valve defect reported during stock intake',
    disposalStatus: 'Vendor RMA Return / Bio-Disposal',
    disposedBy: 'Alex Rivera, PharmD',
    timestamp: '2026-10-15 09:45'
  }
];

export default function FefoWastageManager({
  batches = [],
  role = 'ADMIN'
}) {
  const [logs, setLogs] = useState(INITIAL_WASTAGE_LOGS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [writeOffQty, setWriteOffQty] = useState(10);
  const [wastageReason, setWastageReason] = useState('Expired past safe administration window');
  const [disposalMethod, setDisposalMethod] = useState('Incineration Certificate Issued');
  const [toastMsg, setToastMsg] = useState(null);

  const totalFinancialLoss = logs.reduce((acc, l) => acc + (l.financialLoss || 0), 0);
  const totalUnitsWasted = logs.reduce((acc, l) => acc + (l.quantityWrittenOff || 0), 0);

  const handleRecordWastage = (e) => {
    e.preventDefault();
    const batch = batches.find((b) => String(b.batchId || b.id) === String(selectedBatchId));
    const unitCost = batch?.purchaseCost || batch?.purchasePrice || 12.00;
    const loss = writeOffQty * unitCost;

    const newLog = {
      id: Date.now(),
      medicineName: batch?.medicineName || 'Unspecified Medicine',
      batchNumber: batch?.batchNumber || 'BATCH-UNKNOWN',
      quantityWrittenOff: writeOffQty,
      unitCost,
      financialLoss: loss,
      reason: wastageReason,
      disposalStatus: disposalMethod,
      disposedBy: role.includes('ADMIN') ? 'Dr. Sarah Khan' : 'Alex Rivera, PharmD',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setLogs([newLog, ...logs]);
    setIsModalOpen(false);
    setToastMsg(`Wastage record saved. Financial loss of ${formatCurrency(loss)} logged.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleExport = () => {
    const data = logs.map((l) => ({
      Medicine: l.medicineName,
      Batch: l.batchNumber,
      QuantityWrittenOff: l.quantityWrittenOff,
      FinancialLoss: l.financialLoss,
      Reason: l.reason,
      DisposalStatus: l.disposalStatus,
      AuthorizedUser: l.disposedBy,
      Timestamp: l.timestamp
    }));
    exportToCsv(data, `FEFO_Wastage_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      {toastMsg && (
        <div style={{ background: '#0F4A47', color: '#ffffff', padding: '12px 18px', borderRadius: 10, marginBottom: 16 }}>
          {toastMsg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#16324F', fontWeight: 700 }}>
            Wastage & Write-Off Management
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.84rem' }}>
            Permanent regulatory audit logging for expired, recalled, or damaged stock write-offs without record deletion.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setIsModalOpen(true)}
            className="clay-action-pill-btn clay-action-pill-btn--primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconPlus size={15} /> Record Stock Write-Off
          </button>
          <button
            onClick={handleExport}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
          >
            <IconDownload size={15} /> Export Audit CSV
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#9f1239', fontWeight: 600 }}>Total Financial Wastage</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e11d48' }}>{formatCurrency(totalFinancialLoss)}</div>
        </div>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 18px' }}>
          <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Total Units Written Off</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{totalUnitsWasted} units</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Medicine & Batch</th>
              <th style={{ padding: '12px 16px' }}>Units Wasted</th>
              <th style={{ padding: '12px 16px' }}>Financial Loss</th>
              <th style={{ padding: '12px 16px' }}>Reason</th>
              <th style={{ padding: '12px 16px' }}>Disposal Status</th>
              <th style={{ padding: '12px 16px' }}>Authorized Officer</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '12px 16px', fontSize: '0.82rem', color: '#64748b' }}>{l.timestamp}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{l.medicineName}</div>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#008C8C' }}>{l.batchNumber}</div>
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#e11d48' }}>
                  {l.quantityWrittenOff} units
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#e11d48' }}>
                  {formatCurrency(l.financialLoss)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: '#475569' }}>
                  {l.reason}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="staff-badge staff-badge--neutral" style={{ fontSize: '0.74rem' }}>
                    {l.disposalStatus}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '0.84rem', color: '#334155', fontWeight: 500 }}>
                  {l.disposedBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Write-off Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#991b1b' }}>
              Record Inventory Write-Off & Disposal
            </h4>
            <form onSubmit={handleRecordWastage}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Select Affected Batch *
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.batchId || b.id} value={b.batchId || b.id}>
                      {b.medicineName} ({b.batchNumber}) — Avail: {b.quantityAvailable} units
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Units to Write Off *
                </label>
                <input
                  type="number"
                  min="1"
                  value={writeOffQty}
                  onChange={(e) => setWriteOffQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Reason for Write-Off *
                </label>
                <input
                  type="text"
                  value={wastageReason}
                  onChange={(e) => setWastageReason(e.target.value)}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Disposal Protocol *
                </label>
                <select
                  value={disposalMethod}
                  onChange={(e) => setDisposalMethod(e.target.value)}
                  className="clay-form-input"
                  style={{ width: '100%' }}
                >
                  <option value="Incineration Certificate Issued">Incineration (Hospital Biomedical)</option>
                  <option value="Hazardous Chemical Neutralization">Hazardous Chemical Neutralization</option>
                  <option value="Vendor RMA Return / Bio-Disposal">Vendor Return / RMA Quarantine</option>
                  <option value="Controlled Pharmaceutical Landfill">Controlled Landfill</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="clay-action-pill-btn clay-action-pill-btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="clay-action-pill-btn clay-action-pill-btn--primary"
                  style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
                >
                  Confirm Write-Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

