/**
 * Input 컴포넌트
 * 입력 필드와 텍스트 영역을 제공합니다.
 */

import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import './Input.css';

// ============================================
// Input 컴포넌트
// ============================================

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    /** 라벨 텍스트 */
    label?: string;
    /** 에러 메시지 */
    error?: string;
    /** 전체 너비 사용 */
    fullWidth?: boolean;
}

/**
 * 텍스트 입력 컴포넌트
 */
export function Input({ label, error, fullWidth = false, disabled, ...props }: InputProps) {
    const wrapperClass = ['input-wrapper', fullWidth && 'input-wrapper--full']
        .filter(Boolean)
        .join(' ');

    const inputClass = ['input', error && 'input--error', disabled && 'input--disabled']
        .filter(Boolean)
        .join(' ');

    return (
        <div className={wrapperClass}>
            {label && <label className="input-label">{label}</label>}
            <input className={inputClass} disabled={disabled} {...props} />
            {error && <span className="input-error">{error}</span>}
        </div>
    );
}

// ============================================
// Textarea 컴포넌트
// ============================================

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
    /** 라벨 텍스트 */
    label?: string;
    /** 에러 메시지 */
    error?: string;
    /** 전체 너비 사용 */
    fullWidth?: boolean;
}

/**
 * 텍스트 영역 컴포넌트
 */
export function Textarea({ label, error, fullWidth = false, disabled, ...props }: TextareaProps) {
    const wrapperClass = ['input-wrapper', fullWidth && 'input-wrapper--full']
        .filter(Boolean)
        .join(' ');

    const textareaClass = ['textarea', error && 'textarea--error', disabled && 'textarea--disabled']
        .filter(Boolean)
        .join(' ');

    return (
        <div className={wrapperClass}>
            {label && <label className="input-label">{label}</label>}
            <textarea className={textareaClass} disabled={disabled} {...props} />
            {error && <span className="input-error">{error}</span>}
        </div>
    );
}
