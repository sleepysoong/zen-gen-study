/**
 * StudyPage 컴포넌트
 * 학습 콘텐츠를 표시하는 메인 페이지입니다.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ContentSummary } from '../components/study/ContentSummary';
import { QuizSection } from '../components/study/QuizSection';
import { RelatedTopics } from '../components/study/RelatedTopics';
import { ThinkMore } from '../components/study/ThinkMore';
import { FlashcardSection } from '../components/study/FlashcardSection';
import { ChatWindow } from '../components/chat/ChatWindow';
import { VideoPlayer } from '../components/video/VideoPlayer';
import { getVideoInfo, getTranscript } from '../services/youtube';
import {
    generateSummary,
    generateQuiz,
    generateThinkMore,
    generateRelated,
    generateFlashcards,
} from '../services/openrouter';
import { getSettings, saveHistoryItem, getHistoryItem } from '../services/storage';
import type { VideoInfo, Quiz, RelatedKeyword, Flashcard, TranscriptSegment } from '../types';
import './StudyPage.css';

// ============================================
// 상수
// ============================================

const TABS = [
    { id: 'summary', label: '핵심 정리' },
    { id: 'quiz', label: '퀴즈' },
    { id: 'flashcard', label: '플래시카드' },
    { id: 'related', label: '연관 내용' },
    { id: 'video', label: '영상 보기' },
    { id: 'chat', label: '질문하기' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface LocationState {
    videoInfo?: VideoInfo;
}

// ============================================
// 컴포넌트
// ============================================

/**
 * 학습 페이지 컴포넌트
 */
export function StudyPage() {
    const { videoId } = useParams<{ videoId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as LocationState | null;

    const [activeTab, setActiveTab] = useState<TabId>('summary');
    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(state?.videoInfo || null);
    const [transcript, setTranscript] = useState('');
    const [segments, setSegments] = useState<TranscriptSegment[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    // 생성된 콘텐츠
    const [summary, setSummary] = useState('');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [thinkMore, setThinkMore] = useState('');
    const [related, setRelated] = useState<RelatedKeyword[]>([]);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

    // 초기 데이터 로드
    useEffect(() => {
        async function loadData() {
            if (!videoId) return;

            try {
                // 비디오 정보 가져오기
                if (!videoInfo) {
                    const info = await getVideoInfo(videoId);
                    setVideoInfo(info);
                }

                // 이전 학습 기록 확인
                const historyItem = getHistoryItem(videoId);
                if (historyItem) {
                    if (historyItem.summary) setSummary(historyItem.summary);
                    if (historyItem.quizzes) setQuizzes(historyItem.quizzes);
                    if (historyItem.thinkMore) setThinkMore(historyItem.thinkMore);
                    if (historyItem.related) setRelated(historyItem.related);
                    if (historyItem.transcript) setTranscript(historyItem.transcript);
                }

                // 자막 가져오기
                const transcriptData = await getTranscript(videoId);
                if (transcriptData.fullText) {
                    setTranscript(transcriptData.fullText);
                }
                if (transcriptData.segments && transcriptData.segments.length > 0) {
                    setSegments(transcriptData.segments);
                }
            } catch (err) {
                console.error('데이터 로드 실패:', err);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [videoId, videoInfo]);

    // 히스토리 저장
    const saveToHistory = useCallback(
        (
            updates: Partial<{
                summary: string;
                quizzes: Quiz[];
                thinkMore: string;
                related: RelatedKeyword[];
            }>
        ) => {
            if (!videoId) return;
            saveHistoryItem({
                videoId,
                title: videoInfo?.title,
                thumbnailUrl: videoInfo?.thumbnailUrl,
                transcript,
                summary,
                quizzes,
                thinkMore,
                related,
                ...updates,
            });
        },
        [videoId, videoInfo, transcript, summary, quizzes, thinkMore, related]
    );

    // AI 콘텐츠 생성
    const handleGenerate = async (
        type: 'summary' | 'quiz' | 'thinkMore' | 'related' | 'flashcard'
    ) => {
        const settings = getSettings();

        if (!settings.apiKey) {
            setError('API 키가 설정되지 않았습니다. 설정 페이지에서 OpenRouter API 키를 입력해주세요.');
            return;
        }

        if (!transcript) {
            setError('자막을 불러올 수 없습니다. 영상 내용을 직접 입력해주세요.');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            const { apiKey, model, maxTokens } = settings;

            switch (type) {
                case 'summary': {
                    const result = await generateSummary(apiKey, model, transcript, maxTokens);
                    setSummary(result);
                    saveToHistory({ summary: result });
                    break;
                }
                case 'quiz': {
                    const result = await generateQuiz(apiKey, model, transcript, maxTokens);
                    setQuizzes(result.quizzes || []);
                    saveToHistory({ quizzes: result.quizzes || [] });
                    break;
                }
                case 'thinkMore': {
                    const result = await generateThinkMore(apiKey, model, transcript);
                    setThinkMore(result);
                    saveToHistory({ thinkMore: result });
                    break;
                }
                case 'related': {
                    const result = await generateRelated(apiKey, model, transcript);
                    setRelated(result.keywords || []);
                    saveToHistory({ related: result.keywords || [] });
                    break;
                }
                case 'flashcard': {
                    const result = await generateFlashcards(apiKey, model, transcript, maxTokens);
                    const cards: Flashcard[] = (result.flashcards || []).map((card, index) => ({
                        id: `card-${Date.now()}-${index}`,
                        front: card.front,
                        back: card.back,
                        known: false,
                    }));
                    setFlashcards(cards);
                    break;
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'AI 콘텐츠 생성에 실패했습니다.');
        } finally {
            setGenerating(false);
        }
    };

    // 플래시카드 상태 업데이트
    const handleUpdateFlashcard = (id: string, known: boolean) => {
        setFlashcards((prev) =>
            prev.map((card) => (card.id === id ? { ...card, known } : card))
        );
    };

    // 모든 콘텐츠 생성
    const handleGenerateAll = async () => {
        await handleGenerate('summary');
        await handleGenerate('quiz');
        await handleGenerate('thinkMore');
        await handleGenerate('related');
    };

    if (loading) {
        return (
            <div className="study-page">
                <div className="study-loading">
                    <div className="loading-spinner" />
                    <p>학습 자료를 준비하고 있어요...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="study-page">
            {/* 비디오 헤더 */}
            <div className="study-header">
                <div className="study-header-content">
                    <button className="back-button" onClick={() => navigate('/')}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        돌아가기
                    </button>
                    <div className="video-info">
                        <h1 className="video-title">{videoInfo?.title || '학습 중'}</h1>
                        {videoInfo?.author && <span className="video-author">{videoInfo.author}</span>}
                    </div>
                </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
                <div className="study-error">
                    <p>{error}</p>
                    <Button variant="ghost" size="sm" onClick={() => setError('')}>
                        닫기
                    </Button>
                </div>
            )}

            {/* 탭 네비게이션 */}
            <div className="study-tabs">
                <div className="study-tabs-inner">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`study-tab ${activeTab === tab.id ? 'study-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="study-content">
                <div className="study-content-inner">
                    {activeTab === 'summary' && (
                        <ContentSummary
                            summary={summary}
                            loading={generating}
                            onGenerate={() => handleGenerate('summary')}
                            onGenerateAll={handleGenerateAll}
                            transcript={transcript}
                            onTranscriptChange={setTranscript}
                        />
                    )}

                    {activeTab === 'quiz' && (
                        <QuizSection
                            quizzes={quizzes}
                            loading={generating}
                            onGenerate={() => handleGenerate('quiz')}
                            videoTitle={videoInfo?.title}
                        />
                    )}

                    {activeTab === 'flashcard' && (
                        <FlashcardSection
                            flashcards={flashcards}
                            loading={generating}
                            onGenerate={() => handleGenerate('flashcard')}
                            onUpdateCard={handleUpdateFlashcard}
                        />
                    )}

                    {activeTab === 'related' && (
                        <>
                            <ThinkMore
                                content={thinkMore}
                                loading={generating}
                                onGenerate={() => handleGenerate('thinkMore')}
                            />
                            <RelatedTopics
                                keywords={related}
                                loading={generating}
                                onGenerate={() => handleGenerate('related')}
                            />
                        </>
                    )}

                    {activeTab === 'video' && videoId && (
                        <VideoPlayer videoId={videoId} segments={segments} transcript={transcript} />
                    )}

                    {activeTab === 'chat' && videoId && (
                        <ChatWindow videoId={videoId} context={transcript} />
                    )}
                </div>
            </div>
        </div>
    );
}
