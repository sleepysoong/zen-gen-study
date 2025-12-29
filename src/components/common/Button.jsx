/**
 * Button 컴포넌트
 */
import './Button.css';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    fullWidth = false,
    type = 'button',
    onClick,
    className = '',
    ...props
}) {
    const baseClass = 'button';
    const variantClass = `button--${variant}`;
    const sizeClass = `button--${size}`;
    const stateClasses = [
        disabled && 'button--disabled',
        loading && 'button--loading',
        fullWidth && 'button--full-width'
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={`${baseClass} ${variantClass} ${sizeClass} ${stateClasses} ${className}`}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <span className="button__spinner" />}
            <span className={loading ? 'button__content--hidden' : ''}>
                {children}
            </span>
        </button>
    );
}
