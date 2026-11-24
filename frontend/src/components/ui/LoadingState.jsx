import './StateScreens.css';

/**
 * Full-page loading spinner.
 * @param {string} message
 */
export default function LoadingState({ message = 'Loading…' }) {
  return (
    <div className="state-screen state-screen--loading">
      <div className="spinner" style={{ width: 36, height: 36 }} />
      <p className="state-screen__message">{message}</p>
    </div>
  );
}
