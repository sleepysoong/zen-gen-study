/**
 * Input 컴포넌트
 */
import './Input.css';

export function Input({
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled = false,
    error = '',
    label = '',
    id,
    className = '',
    fullWidth = true,
    ...props
}) {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full' : ''} ${className}`}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                className={`input ${error ? 'input--error' : ''} ${disabled ? 'input--disabled' : ''}`}
                {...props}
            />
            {error && <span className="input-error">{error}</span>}
        </div>
    );
}

export function Textarea({
    value,
    onChange,
    placeholder,
    disabled = false,
    error = '',
    label = '',
    id,
    rows = 4,
    className = '',
    fullWidth = true,
    ...props
}) {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full' : ''} ${className}`}>
            {label && (
                <label htmlFor={textareaId} className="input-label">
                    {label}
                </label>
            )}
            <textarea
                id={textareaId}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={`input input--textarea ${error ? 'input--error' : ''} ${disabled ? 'input--disabled' : ''}`}
                {...props}
            />
            {error && <span className="input-error">{error}</span>}
        </div>
    );
}
