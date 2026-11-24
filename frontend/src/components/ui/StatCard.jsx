import { IconTrendUp, IconTrendDown } from '../icons/Icons';
import './StatCard.css';

/**
 * Dashboard statistics card.
 *
 * @param {string}  title      – e.g. "Total Medicines"
 * @param {string}  value      – e.g. "1,247"
 * @param {string}  subtitle   – e.g. "+12% from last month"
 * @param {'up'|'down'|null}  trend
 * @param {string}  trendColor – CSS color override
 * @param {string}  accentColor – background tint for the icon area
 * @param {React.ReactNode}   icon – the icon component to render
 * @param {boolean} loading    – show skeleton
 */
export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  accentColor = 'var(--color-primary-50)',
  iconColor = 'var(--color-primary-600)',
  icon,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="stat-card stat-card--loading">
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '40%', height: 24 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stat-card fade-in">
      <div className="stat-card__icon" style={{ background: accentColor, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-card__body">
        <span className="stat-card__title">{title}</span>
        <span className="stat-card__value">{value}</span>
        {subtitle && (
          <span className={`stat-card__subtitle ${trend === 'up' ? 'stat-card__subtitle--up' : ''} ${trend === 'down' ? 'stat-card__subtitle--down' : ''}`}>
            {trend === 'up' && <IconTrendUp size={14} />}
            {trend === 'down' && <IconTrendDown size={14} />}
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
