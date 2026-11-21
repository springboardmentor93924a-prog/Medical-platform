// Role selector — 2x2 grid of clickable role cards
const ROLES = [
    {
        id: 'admin',
        label: 'Admin',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                <path d="M17 11l1.5 1.5L21 10" />
            </svg>
        )
    },
    {
        id: 'pharmacist',
        label: 'Pharmacist',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
            </svg>
        )
    },
    {
        id: 'staff',
        label: 'Staff',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        )
    },
    {
        id: 'supplier',
        label: 'Supplier',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 5v4h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
        )
    },
]

function RoleSelector({ value, onChange, error }) {
    return (
        <div className="form-group">
            <p className="role-label">Select Your Role</p>
            <div className="role-grid">
                {ROLES.map((role) => (
                    <div
                        key={role.id}
                        className={`role-card${value === role.id ? ' selected' : ''}`}
                        onClick={() => onChange(role.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onChange(role.id)}
                    >
                        {role.icon}
                        {role.label}
                    </div>
                ))}
            </div>
            {error && (
                <span className="field-error" style={{ marginTop: 6 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6.5" fill="#ef4444" /><path d="M6.5 3.5v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><circle cx="6.5" cy="9.5" r="0.75" fill="white" /></svg>
                    {error}
                </span>
            )}
        </div>
    )
}

export default RoleSelector
