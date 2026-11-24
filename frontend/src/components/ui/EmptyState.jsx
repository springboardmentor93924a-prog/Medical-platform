import { IconPackage } from '../icons/Icons';
import './StateScreens.css';

/**
 * Empty state — shown when there's no data to display.
 * @param {string} title
 * @param {string} message
 * @param {React.ReactNode} action – optional CTA button
 * @param {React.ReactNode} icon   – optional override icon
 */
export default function EmptyState({
  title = 'No data yet',
  message = 'There are no records to display. Data will appear here once available.',
  action,
  icon,
}) {
  return (
    <div className="state-screen state-screen--empty fade-in">
      <div className="state-screen__icon state-screen__icon--empty">
        {icon || <IconPackage size={40} />}
      </div>
      <h3 className="state-screen__title">{title}</h3>
      <p className="state-screen__message">{message}</p>
      {action && <div className="state-screen__action">{action}</div>}
    </div>
  );
}
