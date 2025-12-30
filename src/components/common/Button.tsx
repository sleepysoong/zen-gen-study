/**
 * Button 컴포넌트
 * 다양한 스타일과 상태를 지원하는 버튼입니다.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { ButtonVariant, ButtonSize } from '../../types';
import './Button.css';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
    /** 버튼 변형 스타일 */
    variant?: ButtonVariant;
    /** 버튼 크기 */
    size?: ButtonSize;
    /** 로딩 상태 */
    loading?: boolean;
    /** 전체 너비 사용 */
    fullWidth?: boolean;
    /** 자식 요소 */
    children: ReactNode;
}

/**
 * 재사용 가능한 버튼 컴포넌트
 */
export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
}: ButtonProps) {
    const classNames = [
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        fullWidth && 'btn--full',
        loading && 'btn--loading',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button className={classNames} disabled={disabled || loading} {...props}>
            {loading && <span className="btn-spinner" />}
            <span className="btn-content">{children}</span>
        </button>
    );
}
