import React from 'react';
import {
  IconBox,
  IconClock,
  IconAlertTriangle,
  IconShield,
  IconCheckCircle,
  IconFileText,
  IconActivity
} from '../icons/Icons';
import { formatCurrency } from './fefoUtils';

export default function FefoKpiCards({ stats, onCardClick, activeFilter }) {
  const s = stats || {
    totalBatches: 0,
    eligibleBatches: 0,
    nearExpiryBatches: 0,
    expiredBatches: 0,
    quarantinedBatches: 0,
    complianceRate: 98.4,
    valueAtRisk: 0,
    totalWastage: 0,
  };

  const cards = [
    {
      id: 'total',
      label: 'Total Batches',
      value: s.totalBatches,
      sub: `${s.eligibleBatches} Eligible for FEFO`,
      colorClass: 'clay-squircle--blue',
      icon: IconBox,
      highlight: activeFilter === 'ALL'
    },
    {
      id: 'nearExpiry',
      label: 'Near-Expiry Batches',
      value: s.nearExpiryBatches,
      sub: 'Action: Prioritize dispensing',
      colorClass: 'clay-squircle--amber',
      icon: IconClock,
      highlight: activeFilter === 'NEAR_30'
    },
    {
      id: 'expired',
      label: 'Expired Batches',
      value: s.expiredBatches,
      sub: 'Action: Strictly quarantined',
      colorClass: 'clay-squircle--red',
      icon: IconAlertTriangle,
      highlight: activeFilter === 'EXPIRED'
    },
    {
      id: 'compliance',
      label: 'FEFO Compliance',
      value: `${s.complianceRate || 98.4}%`,
      sub: 'First Expiry, First Out rate',
      colorClass: 'clay-squircle--teal',
      icon: IconShield,
    },
  ];

  return (
    <div className="clay-stat-grid-4" style={{ marginBottom: 20 }}>
      {cards.map((c) => {
        const IconComponent = c.icon;
        return (
          <div
            key={c.id}
            className={`clay-stat-card ${c.highlight ? 'clay-stat-card--selected' : ''}`}
            onClick={() => onCardClick && onCardClick(c.id)}
            style={{ cursor: onCardClick ? 'pointer' : 'default' }}
          >
            <div className="clay-stat-card__info">
              <span className="clay-stat-card__label">{c.label}</span>
              <div className="clay-stat-card__value">{c.value}</div>
              <span className="clay-stat-card__sub">{c.sub}</span>
            </div>
            <div className={`clay-stat-card__icon-squircle ${c.colorClass}`}>
              <IconComponent size={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

