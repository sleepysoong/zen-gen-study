/**
 * ChatWindow - 챗봇 창 컴포넌트
 */
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { chatWithContext } from '../../services/openrouter';
import { getSettings, getChatSessions, saveChatSession } from '../../services/storage';
import './ChatWindow.css';

export function ChatWindow({ videoId, context }) {
    const [sessions, setSessions] = useState(() => getChatSessions(videoId));
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [streamingContent, setStreamingContent] = useState('');
    const messagesEndRef = useRef(null);

    // 현재 세션 메시지 로드
    useEffect(() => {
        if (currentSessionId) {
            const session = sessions.find(s => s.id === currentSessionId);
            if (session) {
                setMessages(session.messages || []);
            }
        } else {
            setMessages([]);
        }
    }, [currentSessionId, sessions]);

    // 스크롤 자동 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    const createNewSession = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setError('');
    };

    const handleSend = async (content) => {
        const settings = getSettings();

        if (!settings.apiKey) {
            setError('API 키가 설정되지 않았습니다. 설정 페이지에서 OpenRouter API 키를 입력해주세요.');
            return;
        }

        if (!context) {
            setError('영상 내용이 없습니다. 먼저 자막을 입력해주세요.');
            return;
        }

        const userMessage = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setError('');
        setLoading(true);
        setStreamingContent('');

        try {
            const aiResponse = await chatWithContext({
                apiKey: settings.apiKey,
                model: settings.model,
                context,
                messages: newMessages,
                maxTokens: settings.maxTokens,
                onStream: (chunk, full) => {
                    setStreamingContent(full);
                }
            });

            const assistantMessage = { role: 'assistant', content: aiResponse };
            const updatedMessages = [...newMessages, assistantMessage];
            setMessages(updatedMessages);
            setStreamingContent('');

            // 세션 저장
            const sessionId = currentSessionId || Date.now().toString(36);
            const session = {
                id: sessionId,
                title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
                messages: updatedMessages
            };
            saveChatSession(videoId, session);

            if (!currentSessionId) {
                setCurrentSessionId(sessionId);
                setSessions(getChatSessions(videoId));
            }
        } catch (err) {
            setError(err.message || '응답을 받는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const suggestedQuestions = [
        '이 내용의 핵심 개념을 간단히 설명해줘',
        '실생활에서 어떻게 활용할 수 있어?',
        '이해가 안 되는 부분이 있어, 더 쉽게 설명해줘'
    ];

    return (
        <div className="chat-window">
            {/* 세션 목록 */}
            {sessions.length > 0 && (
                <div className="chat-sessions">
                    <button
                        className={`chat-session-btn ${!currentSessionId ? 'chat-session-btn--active' : ''}`}
                        onClick={createNewSession}
                    >
                        + 새 대화
                    </button>
                    {sessions.map((session) => (
                        <button
                            key={session.id}
                            className={`chat-session-btn ${currentSessionId === session.id ? 'chat-session-btn--active' : ''}`}
                            onClick={() => setCurrentSessionId(session.id)}
                        >
                            {session.title}
                        </button>
                    ))}
                </div>
            )}

            {/* 메시지 영역 */}
            <div className="chat-messages">
                {messages.length === 0 && !streamingContent && (
                    <div className="chat-welcome">
                        <h3 className="chat-welcome-title">영상 내용에 대해 질문해보세요</h3>
                        <p className="chat-welcome-description">
                            AI가 영상 내용을 바탕으로 답변해드려요.
                        </p>
                        <div className="chat-suggestions">
                            {suggestedQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    className="chat-suggestion-btn"
                                    onClick={() => handleSend(q)}
                                    disabled={loading}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                ))}

                {streamingContent && (
                    <ChatMessage message={{ role: 'assistant', content: streamingContent }} isStreaming />
                )}

                {loading && !streamingContent && (
                    <div className="chat-loading">
                        <div className="chat-loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="chat-error">
                    <p>{error}</p>
                    <button onClick={() => setError('')}>닫기</button>
                </div>
            )}

            {/* 입력 영역 */}
            <ChatInput onSend={handleSend} disabled={loading} />
        </div>
    );
}
