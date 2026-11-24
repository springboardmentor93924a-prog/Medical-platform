import './StatusBadge.css';

/**
 * Coloured pill badge for statuses.
 *
 * @param {'success'|'warning'|'danger'|'info'|'neutral'} variant
 * @param {string} label
 */
export default function StatusBadge({ variant = 'neutral', label }) {
  return (
    <span className={`status-badge status-badge--${variant}`}>
      <span className="status-badge__dot" />
      {label}
    </span>
  );
}
