import { IconAlertTriangle, IconRefresh } from '../icons/Icons';
import './StateScreens.css';

/**
 * Error state — shown when an API call or operation fails.
 * @param {string} title
 * @param {string} message
 * @param {function} onRetry
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load the data. Please try again.',
  onRetry,
}) {
  return (
    <div className="state-screen state-screen--error fade-in">
      <div className="state-screen__icon state-screen__icon--error">
        <IconAlertTriangle size={40} />
      </div>
      <h3 className="state-screen__title">{title}</h3>
      <p className="state-screen__message">{message}</p>
      {onRetry && (
        <div className="state-screen__action">
          <button className="state-screen__btn" onClick={onRetry}>
            <IconRefresh size={16} />
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
