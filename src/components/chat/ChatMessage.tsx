/**
 * ChatMessage 컴포넌트
 * 채팅 메시지를 렌더링합니다.
 */

import { MarkdownRenderer } from '../common/MarkdownRenderer';
import type { ChatMessage as ChatMessageType } from '../../types';
import './ChatMessage.css';

interface ChatMessageProps {
    /** 채팅 메시지 */
    message: ChatMessageType;
}

/**
 * 채팅 메시지 컴포넌트
 */
export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
            <div className="chat-message-avatar">{isUser ? '나' : 'AI'}</div>
            <div className="chat-message-content">
                {isUser ? (
                    <p>{message.content}</p>
                ) : (
                    <MarkdownRenderer content={message.content} />
                )}
            </div>
        </div>
    );
}
