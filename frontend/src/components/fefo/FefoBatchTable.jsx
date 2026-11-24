import React from 'react';
import {
  IconBox,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
  IconShield,
  IconArrowRight
} from '../icons/Icons';
import { getDaysRemaining, getExpiryRiskLevel } from './fefoUtils';

export default function FefoBatchTable({
  batches = [],
  role = 'PHARMACIST',
  onSelectBatch,
  onQuarantineBatch,
  onReportDiscrepancy
}) {
  const isAdmin = role.includes('ADMIN');
  const isPharmacist = role.includes('PHARM');
  const isStaff = role.includes('STAFF') && !isAdmin && !isPharmacist;

  const getPriorityBadge = (priority, status) => {
    if (status === 'EXPIRED') return <span className="staff-badge staff-badge--critical">Blocked: Expired</span>;
    if (status === 'QUARANTINED') return <span className="staff-badge staff-badge--warning">Quarantined</span>;
    if (status === 'RECALLED') return <span className="staff-badge staff-badge--critical">Recalled</span>;
    if (priority === 'Use first' || priority === 1) {
      return <span className="staff-badge staff-badge--received" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>Priority 1: Use First</span>;
    }
    if (priority === 'Next' || priority === 2) {
      return <span className="staff-badge staff-badge--inprogress" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>Priority 2: Next</span>;
    }
    return <span className="staff-badge staff-badge--neutral">Priority 3: Later</span>;
  };

  return (
    <div className="clay-card-table" style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '14px 16px' }}>FEFO Priority</th>
              <th style={{ padding: '14px 16px' }}>Medicine</th>
              <th style={{ padding: '14px 16px' }}>Batch No</th>
              <th style={{ padding: '14px 16px' }}>Shelf Location</th>
              <th style={{ padding: '14px 16px' }}>Expiry Date</th>
              <th style={{ padding: '14px 16px' }}>Available / Reserved</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  No batch inventory records found for current criteria.
                </td>
              </tr>
            ) : (
              batches.map((b) => {
                const daysRemaining = getDaysRemaining(b.expiryDate);
                const risk = getExpiryRiskLevel(daysRemaining);
                const isBlocked = b.status === 'EXPIRED' || b.status === 'QUARANTINED' || b.status === 'RECALLED' || daysRemaining <= 0;

                return (
                  <tr key={b.batchId || b.id} style={{ borderBottom: '1px solid #f1f5f9', background: isBlocked ? '#fffafa' : '#ffffff' }}>
                    <td style={{ padding: '14px 16px' }}>
                      {getPriorityBadge(b.fefoRecommendation || b.fefoRank, b.status || (daysRemaining <= 0 ? 'EXPIRED' : 'ACTIVE'))}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.medicineName}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{b.manufacturer || b.supplierName || 'Standard Supplier'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#008C8C' }}>
                      {b.batchNumber}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 500 }}>
                        {b.shelfLocation || b.storageLocation || 'Aisle 2, Bin C'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: risk.color }}>{b.expiryDate}</div>
                      <div style={{ fontSize: '0.76rem', color: risk.color }}>
                        {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days left`}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: b.quantityAvailable <= 10 ? '#dc2626' : '#1e293b' }}>
                        {b.quantityAvailable ?? 0}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}> / {b.quantityReserved || 0} res</span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`staff-badge ${isBlocked ? 'staff-badge--critical' : 'staff-badge--received'}`}>
                        {b.status || (daysRemaining <= 0 ? 'EXPIRED' : 'ACTIVE')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {isPharmacist && !isBlocked && (
                        <button
                          className="clay-action-pill-btn clay-action-pill-btn--primary"
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                          onClick={() => onSelectBatch && onSelectBatch(b)}
                        >
                          Allocate <IconArrowRight size={13} style={{ marginLeft: 4 }} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          className="clay-action-pill-btn clay-action-pill-btn--secondary"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => onQuarantineBatch && onQuarantineBatch(b)}
                        >
                          {b.status === 'QUARANTINED' ? 'Release' : 'Quarantine'}
                        </button>
                      )}
                      {isStaff && (
                        <button
                          className="clay-action-pill-btn clay-action-pill-btn--secondary"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => onReportDiscrepancy && onReportDiscrepancy(b)}
                        >
                          Report Issue
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

