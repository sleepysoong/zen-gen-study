/**
 * ChatMessage - 채팅 메시지 컴포넌트
 */
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import './ChatMessage.css';

export function ChatMessage({ message, isStreaming = false }) {
    const isUser = message.role === 'user';

    return (
        <div className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}>
            <div className="chat-message-avatar">
                {isUser ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                )}
            </div>
            <div className="chat-message-content">
                {isUser ? (
                    <p className="chat-message-text">{message.content}</p>
                ) : (
                    <div className="chat-message-markdown">
                        <MarkdownRenderer content={message.content} />
                        {isStreaming && <span className="chat-cursor" />}
                    </div>
                )}
            </div>
        </div>
    );
}
