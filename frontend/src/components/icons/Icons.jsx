/**
 * SVG Icon library — inline SVGs so we don't need an icon package.
 * Each icon is a pure function component accepting className and size.
 */

const defaultProps = { size: 20, className: '' };

function wrap(svgContent, { size, className, viewBox = '0 0 24 24', ...rest } = defaultProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {svgContent}
    </svg>
  );
}

export function IconDashboard(props) {
  return wrap(
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
    props
  );
}

export function IconPill(props) {
  return wrap(
    <>
      <path d="m10.5 1.5 3 3L4.5 13.5l-3-3z" />
      <path d="m13.5 4.5 3 3" />
      <path d="m7.5 10.5 3-3" />
      <circle cx="17" cy="17" r="5" />
      <path d="M17 14v6" />
      <path d="M14 17h6" />
    </>,
    props
  );
}

export function IconInventory(props) {
  return wrap(
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>,
    props
  );
}

export function IconOrders(props) {
  return wrap(
    <>
      <path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z" />
      <path d="M15 3v4a2 2 0 0 0 2 2h4" />
      <path d="M9 13h6" />
      <path d="M9 17h3" />
    </>,
    props
  );
}

export function IconSuppliers(props) {
  return wrap(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>,
    props
  );
}

export function IconReports(props) {
  return wrap(
    <>
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </>,
    props
  );
}

export function IconSettings(props) {
  return wrap(
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    props
  );
}

export function IconSearch(props) {
  return wrap(
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>,
    props
  );
}

export function IconBell(props) {
  return wrap(
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>,
    props
  );
}

export function IconChevronDown(props) {
  return wrap(<path d="m6 9 6 6 6-6" />, props);
}

export function IconChevronLeft(props) {
  return wrap(<path d="m15 18-6-6 6-6" />, props);
}

export function IconChevronRight(props) {
  return wrap(<path d="m9 18 6-6-6-6" />, props);
}

export function IconMenu(props) {
  return wrap(
    <>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>,
    props
  );
}

export function IconX(props) {
  return wrap(
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>,
    props
  );
}

export function IconLogout(props) {
  return wrap(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </>,
    props
  );
}

export function IconTrendUp(props) {
  return wrap(
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>,
    props
  );
}

export const IconTrendingUp = IconTrendUp;

export function IconTrendDown(props) {
  return wrap(
    <>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </>,
    props
  );
}

export function IconAlertTriangle(props) {
  return wrap(
    <>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>,
    props
  );
}

export function IconPackage(props) {
  return wrap(
    <>
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>,
    props
  );
}

export function IconClock(props) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>,
    props
  );
}

export function IconPlus(props) {
  return wrap(
    <>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </>,
    props
  );
}

export function IconFilter(props) {
  return wrap(
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
    props
  );
}

export function IconRefresh(props) {
  return wrap(
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>,
    props
  );
}

export function IconCalendar(props) {
  return wrap(
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </>,
    props
  );
}

export function IconMedicalCross(props) {
  return wrap(
    <>
      <path d="M8 2h8v6h6v8h-6v6H8v-6H2V8h6z" />
    </>,
    { ...props, fill: 'currentColor', stroke: 'none' }
  );
}

export function IconUsers(props) {
  return wrap(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>,
    props
  );
}

export function IconTruck(props) {
  return wrap(
    <>
      <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" />
      <path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </>,
    props
  );
}

export function IconClipboard(props) {
  return wrap(
    <>
      <rect width="14" height="18" x="5" y="4" rx="2" />
      <path d="M9 2h6a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </>,
    props
  );
}

export function IconShield(props) {
  return wrap(
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </>,
    props
  );
}

export function IconDatabase(props) {
  return wrap(
    <>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </>,
    props
  );
}

export function IconFileText(props) {
  return wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </>,
    props
  );
}

export function IconCheckCircle(props) {
  return wrap(
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>,
    props
  );
}

export function IconHistory(props) {
  return wrap(
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <polyline points="12 7 12 12 15 15" />
    </>,
    props
  );
}

export function IconSend(props) {
  return wrap(
    <>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </>,
    props
  );
}

export function IconDollar(props) {
  return wrap(
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>,
    props
  );
}

export function IconLock(props) {
  return wrap(
    <>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>,
    props
  );
}

export function IconEye(props) {
  return wrap(
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    props
  );
}

export function IconTag(props) {
  return wrap(
    <>
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <circle cx="7" cy="7" r=".5" fill="currentColor" />
    </>,
    props
  );
}

export function IconDownload(props) {
  return wrap(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </>,
    props
  );
}

export function IconTrash(props) {
  return wrap(
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </>,
    props
  );
}

export function IconArrowRight(props) {
  return wrap(
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>,
    props
  );
}

export function IconRefreshCw(props) {
  return wrap(
    <>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </>,
    props
  );
}

export function IconMail(props) {
  return wrap(
    <>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </>,
    props
  );
}

export function IconUser(props) {
  return wrap(
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>,
    props
  );
}

export function IconShieldCheck(props) {
  return wrap(
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </>,
    props
  );
}

export function IconTrackReport(props) {
  return wrap(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m8 16 3-3 2 2 3-4" />
    </>,
    props
  );
}

export function MediStockLogoBadge({ size = 44, className = '' }) {
  return (
    <div
      className={`medistock-badge ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
        borderRadius: Math.round(size * 0.28),
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
        flexShrink: 0
      }}
    >
      <svg
        width={Math.round(size * 0.58)}
        height={Math.round(size * 0.58)}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
  );
}

export function IconPhone(props) {
  return wrap(
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </>,
    props
  );
}

export function IconArrowLeft(props) {
  return wrap(
    <>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </>,
    props
  );
}

export function IconCheck(props) {
  return wrap(
    <>
      <polyline points="20 6 9 17 4 12" />
    </>,
    props
  );
}

export function IconAlertCircle(props) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>,
    props
  );
}

export function IconActivity(props) {
  return wrap(
    <>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </>,
    props
  );
}

export function IconKey(props) {
  return wrap(
    <>
      <path d="m21 2-2 2m-1.5 1.5L19 7l-2 2m-2-2 2-2" />
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m11.5 11.5 8-8" />
    </>,
    props
  );
}

export function IconInfo(props) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>,
    props
  );
}

export function IconEdit(props) {
  return wrap(
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>,
    props
  );
}

export function IconPrinter(props) {
  return wrap(
    <>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </>,
    props
  );
}

export function IconMoreVertical(props) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </>,
    props
  );
}

export function IconShoppingCart(props) {
  return wrap(
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>,
    props
  );
}

export function IconBox(props) {
  return wrap(
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </>,
    props
  );
}

export function IconGrid(props) {
  return wrap(
    <>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </>,
    props
  );
}

export function IconMapPin(props) {
  return wrap(
    <>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>,
    props
  );
}

export function IconCreditCard(props) {
  return wrap(
    <>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </>,
    props
  );
}

export function IconFolder(props) {
  return wrap(
    <>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </>,
    props
  );
}

export function IconHelpCircle(props) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>,
    props
  );
}

export function IconXCircle(props) {
  return wrap(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </>,
    props
  );
}

export function IconBriefcase(props) {
  return wrap(
    <>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>,
    props
  );
}

export function IconCamera(props) {
  return wrap(
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </>,
    props
  );
}

export function IconUpload(props) {
  return wrap(
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </>,
    props
  );
}

export function IconSave(props) {
  return wrap(
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </>,
    props
  );
}

export function IconUserPlus(props) {
  return wrap(
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </>,
    props
  );
}

export function IconDoctorStethoscope(props) {
  return wrap(
    <>
      <circle cx="12" cy="7" r="3.5" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M9 11.5v2a3 3 0 0 0 6 0v-2" />
      <path d="M15 13.5v2.5a1.5 1.5 0 0 0 3 0v-1.5" />
      <circle cx="18" cy="14" r="1.2" fill="currentColor" />
    </>,
    props
  );
}

export function IconLogin(props) {
  return wrap(
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </>,
    props
  );
}

export function IconShieldPlus(props) {
  return wrap(
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </>,
    props
  );
}

export function IconMortarPestle(props) {
  return wrap(
    <>
      <path d="M4.5 10h15c0 4.5-3.5 8-7.5 8s-7.5-3.5-7.5-8z" />
      <path d="M8 18h8v2H8z" />
      <path d="M17 4l-4 6" />
    </>,
    props
  );
}

export function IconChartTrend(props) {
  return wrap(
    <>
      <rect x="3" y="14" width="4" height="7" rx="1" />
      <rect x="10" y="10" width="4" height="11" rx="1" />
      <rect x="17" y="6" width="4" height="15" rx="1" />
      <path d="M4 10l6-4 4 3 6-6" />
      <path d="M17 3h4v4" />
    </>,
    props
  );
}

export function MediStockCrossCapsuleLogo({ size = 52, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M38 12C38 7.58172 41.5817 4 46 4H54C58.4183 4 62 7.58172 62 12V38H88C92.4183 38 96 41.5817 96 46V54C96 58.4183 92.4183 62 88 62H62V88C62 92.4183 58.4183 96 54 96H46C41.5817 96 38 92.4183 38 88V62H12C7.58172 62 4 58.4183 4 54V46C4 41.5817 7.58172 38 12 38H38V12Z"
        fill="#00A896"
      />
      <g transform="translate(50, 50) rotate(-45) translate(-24, -12)">
        <rect x="0" y="0" width="48" height="24" rx="12" fill="#FFFFFF" />
        <line x1="24" y1="0" x2="24" y2="24" stroke="#00A896" strokeWidth="2.5" />
      </g>
    </svg>
  );
}

export function IconSparkles(props) {
  return wrap(
    <>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
    </>,
    props
  );
}

export function IconMicrophone(props) {
  return wrap(
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </>,
    props
  );
}

export function IconVolume(props) {
  return wrap(
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </>,
    props
  );
}

export function IconVolumeMute(props) {
  return wrap(
    <>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" x2="16" y1="9" y2="15" />
      <line x1="16" x2="22" y1="9" y2="15" />
    </>,
    props
  );
}

export function IconSquare(props) {
  return wrap(
    <rect width="18" height="18" x="3" y="3" rx="2" />,
    props
  );
}

export function IconMessageSquare(props) {
  return wrap(
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </>,
    props
  );
}

export function IconStar(props) {
  return wrap(
    <>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </>,
    props
  );
}









