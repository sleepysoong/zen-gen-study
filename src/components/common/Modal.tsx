/**
 * Modal 컴포넌트
 * 접근성을 지원하는 모달 다이얼로그입니다.
 */

import { useEffect, useCallback, type ReactNode } from 'react';
import type { ModalSize } from '../../types';
import './Modal.css';

interface ModalProps {
    /** 모달 표시 여부 */
    isOpen: boolean;
    /** 모달 닫기 콜백 */
    onClose: () => void;
    /** 모달 제목 */
    title?: string;
    /** 모달 크기 */
    size?: ModalSize;
    /** 자식 요소 */
    children: ReactNode;
}

/**
 * 모달 다이얼로그 컴포넌트
 */
export function Modal({ isOpen, onClose, title, size = 'md', children }: ModalProps) {
    // ESC 키로 모달 닫기
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div
                className={`modal modal--${size}`}
                onClick={(e) => e.stopPropagation()}
                role="document"
            >
                {title && (
                    <div className="modal-header">
                        <h2 className="modal-title">{title}</h2>
                        <button className="modal-close" onClick={onClose} aria-label="닫기">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="modal-content">{children}</div>
            </div>
        </div>
    );
}
