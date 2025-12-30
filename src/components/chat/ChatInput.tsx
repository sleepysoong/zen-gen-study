/**
 * ChatInput 컴포넌트
 * 채팅 입력 필드를 제공합니다.
 */

import { useState, type KeyboardEvent, type FormEvent } from 'react';
import './ChatInput.css';

interface ChatInputProps {
    /** 메시지 전송 콜백 */
    onSend: (message: string) => void;
    /** 비활성화 상태 */
    disabled?: boolean;
}

/**
 * 채팅 입력 컴포넌트
 */
export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form className="chat-input" onSubmit={handleSubmit}>
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지를 입력하세요..."
                disabled={disabled}
                rows={1}
            />
            <button type="submit" disabled={disabled || !input.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="2" />
                </svg>
            </button>
        </form>
    );
}
