/**
 * ChatInput - 채팅 입력 컴포넌트
 */
import { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

export function ChatInput({ onSend, disabled = false }) {
    const [value, setValue] = useState('');
    const textareaRef = useRef(null);

    // 자동 높이 조절
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
        }
    }, [value]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim() && !disabled) {
            onSend(value.trim());
            setValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className="chat-input" onSubmit={handleSubmit}>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="질문을 입력하세요... (Shift+Enter로 줄바꿈)"
                disabled={disabled}
                rows={1}
                className="chat-input-textarea"
            />
            <button
                type="submit"
                className="chat-input-submit"
                disabled={!value.trim() || disabled}
                aria-label="보내기"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
            </button>
        </form>
    );
}
