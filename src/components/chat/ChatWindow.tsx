/**
 * ChatWindow 컴포넌트
 * AI와의 대화 인터페이스를 제공합니다.
 */

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { chatWithContext } from '../../services/openrouter';
import { getSettings, saveChatSession, getChatSessions } from '../../services/storage';
import type { ChatMessage as ChatMessageType, ChatSession } from '../../types';
import './ChatWindow.css';

interface ChatWindowProps {
    /** YouTube 비디오 ID */
    videoId: string;
    /** 자막 컨텍스트 */
    context: string;
}

/**
 * 채팅 창 컴포넌트
 */
export function ChatWindow({ videoId, context }: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [sessionId, setSessionId] = useState(() => `session-${Date.now()}`);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 메시지 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 메시지 전송
    const handleSendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const settings = getSettings();
        if (!settings.apiKey) {
            setError('API 키가 설정되지 않았습니다. 설정에서 OpenRouter API 키를 입력해주세요.');
            return;
        }

        if (!context) {
            setError('자막을 먼저 불러와주세요.');
            return;
        }

        const userMessage: ChatMessageType = { role: 'user', content };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsLoading(true);
        setError('');

        try {
            let assistantContent = '';
            const assistantMessage: ChatMessageType = { role: 'assistant', content: '' };

            await chatWithContext({
                apiKey: settings.apiKey,
                model: settings.model,
                context,
                messages: newMessages,
                maxTokens: settings.maxTokens,
                onStream: (chunk, fullContent) => {
                    assistantContent = fullContent;
                    setMessages([...newMessages, { ...assistantMessage, content: fullContent }]);
                },
            });

            const finalMessages = [...newMessages, { ...assistantMessage, content: assistantContent }];
            setMessages(finalMessages);

            // 세션 저장
            saveChatSession(videoId, {
                id: sessionId,
                title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
                messages: finalMessages,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI 응답 생성에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 새 채팅 시작
    const handleNewChat = () => {
        setMessages([]);
        setSessionId(`session-${Date.now()}`);
        setError('');
    };

    const suggestedQuestions = [
        '이 내용의 핵심을 요약해줘',
        '더 쉽게 설명해줄 수 있어?',
        '실생활에서 어떻게 적용할 수 있어?',
    ];

    return (
        <div className="chat-window">
            {/* 헤더 */}
            <div className="chat-header">
                <h3 className="chat-title">AI에게 질문하기</h3>
                <button className="chat-new-btn" onClick={handleNewChat}>
                    새 대화
                </button>
            </div>

            {/* 메시지 영역 */}
            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="chat-empty">
                        <p className="chat-empty-text">영상 내용에 대해 궁금한 점을 물어보세요.</p>
                        <div className="chat-suggestions">
                            {suggestedQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    className="chat-suggestion"
                                    onClick={() => handleSendMessage(question)}
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => (
                            <ChatMessage key={index} message={message} />
                        ))}
                        {isLoading && (
                            <div className="chat-loading">
                                <span className="chat-loading-dot" />
                                <span className="chat-loading-dot" />
                                <span className="chat-loading-dot" />
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="chat-error">
                    <p>{error}</p>
                </div>
            )}

            {/* 입력 영역 */}
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
    );
}
