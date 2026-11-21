// Reusable form input with icon, error display, and optional right action
function FormInput({
    id,
    label,
    type = 'text',
    placeholder,
    icon,
    rightAction,
    error,
    hasLeftIcon = true,
    register,
    ...rest
}) {
    return (
        <div className="form-group">
            {label && <label className="form-label" htmlFor={id}>{label}</label>}
            <div className="input-wrap">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    className={`form-input${!hasLeftIcon ? ' no-icon' : ''}${error ? ' error' : ''}`}
                    {...(register ? register : {})}
                    {...rest}
                />
                {rightAction && <button type="button" className="input-action" onClick={rightAction.onClick} tabIndex={-1}>{rightAction.icon}</button>}
            </div>
            {error && (
                <span className="field-error">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="6.5" fill="#ef4444" /><path d="M6.5 3.5v3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" /><circle cx="6.5" cy="9.5" r="0.75" fill="white" /></svg>
                    {error}
                </span>
            )}
        </div>
    )
}

export default FormInput
