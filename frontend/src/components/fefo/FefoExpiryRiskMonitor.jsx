import React, { useState, useMemo } from 'react';
import {
  IconClock,
  IconAlertTriangle,
  IconDownload,
  IconFilter
} from '../icons/Icons';
import { EXPIRY_THRESHOLDS, getDaysRemaining, getExpiryRiskLevel, formatCurrency } from './fefoUtils';
import { exportToCsv } from '../../utils/csvExport';

export default function FefoExpiryRiskMonitor({
  batches = [],
  role = 'ADMIN'
}) {
  const [selectedThreshold, setSelectedThreshold] = useState('ALL');
  const [search, setSearch] = useState('');

  const enriched = useMemo(() => {
    return batches.map((b) => {
      const days = getDaysRemaining(b.expiryDate);
      const risk = getExpiryRiskLevel(days);
      const unitCost = b.purchaseCost || b.purchasePrice || b.unitPrice || 10;
      const qty = b.quantityAvailable || 0;
      const estimatedLoss = qty * unitCost;

      return {
        ...b,
        daysRemaining: days,
        risk,
        estimatedLoss,
        unitCost
      };
    });
  }, [batches]);

  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (b.medicineName && b.medicineName.toLowerCase().includes(q)) ||
          (b.batchNumber && b.batchNumber.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (selectedThreshold === 'ALL') return true;
      if (selectedThreshold === 'EXPIRED') return b.daysRemaining <= 0;
      if (selectedThreshold === 'CRITICAL_7') return b.daysRemaining > 0 && b.daysRemaining <= 7;
      if (selectedThreshold === 'URGENT_15') return b.daysRemaining > 0 && b.daysRemaining <= 15;
      if (selectedThreshold === 'NEAR_30') return b.daysRemaining > 0 && b.daysRemaining <= 30;
      if (selectedThreshold === 'MODERATE_60') return b.daysRemaining > 0 && b.daysRemaining <= 60;
      if (selectedThreshold === 'NOTICE_90') return b.daysRemaining > 0 && b.daysRemaining <= 90;
      return true;
    });
  }, [enriched, search, selectedThreshold]);

  const totalAtRiskValue = useMemo(() => {
    return filtered.reduce((acc, b) => acc + b.estimatedLoss, 0);
  }, [filtered]);

  const handleExport = () => {
    const data = filtered.map((b) => ({
      Medicine: b.medicineName,
      BatchNumber: b.batchNumber,
      ExpiryDate: b.expiryDate,
      DaysRemaining: b.daysRemaining,
      RiskLevel: b.risk.label,
      AvailableUnits: b.quantityAvailable,
      UnitCost: b.unitCost,
      EstimatedLoss: b.estimatedLoss
    }));
    exportToCsv(data, `FEFO_Expiry_Risk_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#16324F', fontWeight: 700 }}>
            Expiry & Risk Monitoring (First Expiry, First Out)
          </h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: '0.84rem' }}>
            Multi-tier expiration horizon tracking, days-remaining countdowns, and financial at-risk valuation.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '8px 14px', fontSize: '0.85rem' }}>
            <span style={{ color: '#991b1b', fontWeight: 600 }}>At-Risk Stock Valuation: </span>
            <strong style={{ color: '#dc2626' }}>{formatCurrency(totalAtRiskValue)}</strong>
          </div>
          <button
            onClick={handleExport}
            className="clay-action-pill-btn clay-action-pill-btn--secondary"
            title="Export Expiry Risk Report to CSV"
          >
            <IconDownload size={15} /> Export Report
          </button>
        </div>
      </div>

      {/* Threshold Pills */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
        {EXPIRY_THRESHOLDS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSelectedThreshold(t.key)}
            className={`clay-action-pill-btn ${selectedThreshold === t.key ? 'clay-action-pill-btn--primary' : 'clay-action-pill-btn--secondary'}`}
            style={{ fontSize: '0.78rem', padding: '5px 12px', whiteSpace: 'nowrap' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search by medicine or batch number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="clay-form-input"
          style={{ width: '100%', maxWidth: 360 }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Risk Level</th>
              <th style={{ padding: '12px 16px' }}>Medicine</th>
              <th style={{ padding: '12px 16px' }}>Batch No</th>
              <th style={{ padding: '12px 16px' }}>Expiry Date</th>
              <th style={{ padding: '12px 16px' }}>Days Left</th>
              <th style={{ padding: '12px 16px' }}>Available Qty</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Est. Financial Loss</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                  No batches found in the selected expiration horizon.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.batchId || b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        background: `${b.risk.color}15`,
                        color: b.risk.color,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}
                    >
                      {b.risk.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                    {b.medicineName}
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#008C8C' }}>
                    {b.batchNumber}
                  </td>
                  <td style={{ padding: '12px 16px', color: b.risk.color, fontWeight: 600 }}>
                    {b.expiryDate}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {b.daysRemaining <= 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 700 }}>Expired</span>
                    ) : (
                      <span style={{ fontWeight: 600 }}>{b.daysRemaining} days</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    {b.quantityAvailable ?? 0} units
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                    {formatCurrency(b.estimatedLoss)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

