/**
 * MediStock FEFO Utilities
 * Standardized "First Expiry, First Out" calculations and helpers.
 */

export const FEFO_TITLE = 'First Expiry, First Out (FEFO)';

export const EXPIRY_THRESHOLDS = [
  { key: 'ALL', label: 'All Batches', days: null },
  { key: 'CRITICAL_7', label: 'Critical (≤ 7 Days)', days: 7, color: '#dc2626', badge: 'critical' },
  { key: 'URGENT_15', label: 'Urgent (≤ 15 Days)', days: 15, color: '#ea580c', badge: 'urgent' },
  { key: 'NEAR_30', label: 'Near Expiry (≤ 30 Days)', days: 30, color: '#f59e0b', badge: 'warning' },
  { key: 'MODERATE_60', label: 'Warning (≤ 60 Days)', days: 60, color: '#d97706', badge: 'moderate' },
  { key: 'NOTICE_90', label: 'Notice (≤ 90 Days)', days: 90, color: '#2563eb', badge: 'notice' },
  { key: 'EXPIRED', label: 'Expired', days: 0, color: '#991b1b', badge: 'expired' },
];

export function getDaysRemaining(expiryDateStr) {
  if (!expiryDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryRiskLevel(daysRemaining) {
  if (daysRemaining <= 0) return { label: 'EXPIRED', color: '#991b1b', badgeClass: 'fefo-badge--expired', level: 'HIGH' };
  if (daysRemaining <= 7) return { label: 'CRITICAL (≤ 7d)', color: '#dc2626', badgeClass: 'fefo-badge--critical', level: 'HIGH' };
  if (daysRemaining <= 15) return { label: 'URGENT (≤ 15d)', color: '#ea580c', badgeClass: 'fefo-badge--urgent', level: 'HIGH' };
  if (daysRemaining <= 30) return { label: 'NEAR EXPIRY (≤ 30d)', color: '#f59e0b', badgeClass: 'fefo-badge--warning', level: 'MEDIUM' };
  if (daysRemaining <= 60) return { label: 'WARNING (≤ 60d)', color: '#d97706', badgeClass: 'fefo-badge--moderate', level: 'LOW' };
  if (daysRemaining <= 90) return { label: 'NOTICE (≤ 90d)', color: '#2563eb', badgeClass: 'fefo-badge--notice', level: 'LOW' };
  return { label: 'HEALTHY (> 90d)', color: '#16a34a', badgeClass: 'fefo-badge--healthy', level: 'NONE' };
}

export function formatCurrency(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

