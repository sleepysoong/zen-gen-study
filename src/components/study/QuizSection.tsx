/**
 * QuizSection 컴포넌트
 * O/X, 선택형, 단답형 퀴즈를 표시합니다.
 * PDF 다운로드 기능을 포함합니다.
 */

import { useState } from 'react';
import { Button } from '../common/Button';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { generateQuizPDF } from '../../utils/pdfGenerator';
import type { Quiz } from '../../types';
import './QuizSection.css';

interface QuizSectionProps {
    /** 퀴즈 배열 */
    quizzes: Quiz[];
    /** 로딩 상태 */
    loading: boolean;
    /** 퀴즈 생성 콜백 */
    onGenerate: () => void;
    /** 영상 제목 (PDF용) */
    videoTitle?: string;
}

/**
 * 퀴즈 유형 라벨을 반환합니다.
 */
function getTypeLabel(type: string): string {
    switch (type) {
        case 'ox':
            return 'O/X';
        case 'choice':
            return '선택형';
        case 'short':
            return '단답형';
        default:
            return '';
    }
}

/**
 * 퀴즈 섹션 컴포넌트
 */
export function QuizSection({ quizzes, loading, onGenerate, videoTitle }: QuizSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, boolean | number | string>>({});
    const [showResults, setShowResults] = useState<Record<number, boolean>>({});
    const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
    const [pdfLoading, setPdfLoading] = useState(false);

    // 빈 상태
    if (!quizzes || quizzes.length === 0) {
        return (
            <div className="quiz-section">
                <div className="quiz-empty">
                    <h3 className="quiz-empty-title">퀴즈</h3>
                    <p className="quiz-empty-description">
                        학습 내용을 바탕으로 O/X, 선택형, 단답형 퀴즈를 생성해요.
                    </p>
                    <Button variant="primary" loading={loading} onClick={onGenerate}>
                        퀴즈 생성
                    </Button>
                </div>
            </div>
        );
    }

    const currentQuiz = quizzes[currentIndex];
    const isAnswered = showResults[currentIndex];

    // O/X 답변 처리
    const handleOXAnswer = (answer: boolean) => {
        setAnswers({ ...answers, [currentIndex]: answer });
        setShowResults({ ...showResults, [currentIndex]: true });
    };

    // 선택형 답변 처리
    const handleChoiceAnswer = (optionIndex: number) => {
        setAnswers({ ...answers, [currentIndex]: optionIndex });
        setShowResults({ ...showResults, [currentIndex]: true });
    };

    // 단답형 제출
    const handleShortSubmit = () => {
        const userAnswer = shortAnswers[currentIndex]?.trim();
        if (userAnswer) {
            setAnswers({ ...answers, [currentIndex]: userAnswer });
            setShowResults({ ...showResults, [currentIndex]: true });
        }
    };

    // 네비게이션
    const handleNext = () => {
        if (currentIndex < quizzes.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    // 재생성
    const handleRegenerate = () => {
        setCurrentIndex(0);
        setAnswers({});
        setShowResults({});
        setShortAnswers({});
        onGenerate();
    };

    // PDF 다운로드
    const handleDownloadPDF = async () => {
        setPdfLoading(true);
        try {
            await generateQuizPDF(quizzes, videoTitle || '학습 퀴즈');
        } catch (error) {
            console.error('PDF 생성 실패:', error);
        } finally {
            setPdfLoading(false);
        }
    };

    // 정답 확인
    const isCorrect = (): boolean => {
        const userAnswer = answers[currentIndex];
        if (currentQuiz.type === 'ox') {
            return userAnswer === currentQuiz.answer;
        } else if (currentQuiz.type === 'choice') {
            return userAnswer === currentQuiz.answer;
        } else if (currentQuiz.type === 'short') {
            const correctAnswer = String(currentQuiz.answer).toLowerCase().trim();
            const userInput = String(userAnswer || '').toLowerCase().trim();
            return (
                correctAnswer === userInput ||
                correctAnswer.includes(userInput) ||
                userInput.includes(correctAnswer)
            );
        }
        return false;
    };

    return (
        <div className="quiz-section">
            {/* 헤더 */}
            <div className="quiz-header">
                <div className="quiz-progress">
                    <span className="quiz-progress-current">{currentIndex + 1}</span>
                    <span className="quiz-progress-divider">/</span>
                    <span className="quiz-progress-total">{quizzes.length}</span>
                </div>
                <div className="quiz-header-actions">
                    <Button variant="secondary" size="sm" loading={pdfLoading} onClick={handleDownloadPDF}>
                        PDF 다운로드
                    </Button>
                </div>
            </div>

            {/* 퀴즈 카드 */}
            <div className="quiz-card">
                <div className="quiz-type-badge">{getTypeLabel(currentQuiz.type)}</div>

                <div className="quiz-question">
                    <MarkdownRenderer content={currentQuiz.question} />
                </div>

                {/* O/X 문제 */}
                {currentQuiz.type === 'ox' && !isAnswered && (
                    <div className="quiz-ox-buttons">
                        <button className="quiz-ox-btn quiz-ox-btn--o" onClick={() => handleOXAnswer(true)}>
                            O
                        </button>
                        <button className="quiz-ox-btn quiz-ox-btn--x" onClick={() => handleOXAnswer(false)}>
                            X
                        </button>
                    </div>
                )}

                {/* 선택형 문제 */}
                {currentQuiz.type === 'choice' && currentQuiz.options && (
                    <div className="quiz-choices">
                        {currentQuiz.options.map((option, idx) => (
                            <button
                                key={idx}
                                className={`quiz-choice-btn ${isAnswered
                                        ? idx === currentQuiz.answer
                                            ? 'quiz-choice-btn--correct'
                                            : answers[currentIndex] === idx
                                                ? 'quiz-choice-btn--wrong'
                                                : ''
                                        : ''
                                    }`}
                                onClick={() => !isAnswered && handleChoiceAnswer(idx)}
                                disabled={isAnswered}
                            >
                                <span className="quiz-choice-number">{idx + 1}</span>
                                <span className="quiz-choice-text">
                                    <MarkdownRenderer content={option} />
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* 단답형 문제 */}
                {currentQuiz.type === 'short' && !isAnswered && (
                    <div className="quiz-short-input">
                        <input
                            type="text"
                            value={shortAnswers[currentIndex] || ''}
                            onChange={(e) => setShortAnswers({ ...shortAnswers, [currentIndex]: e.target.value })}
                            placeholder="답을 입력하세요"
                            onKeyDown={(e) => e.key === 'Enter' && handleShortSubmit()}
                        />
                        <Button variant="primary" size="sm" onClick={handleShortSubmit}>
                            제출
                        </Button>
                    </div>
                )}

                {/* 결과 표시 */}
                {isAnswered && (
                    <div
                        className={`quiz-result ${isCorrect() ? 'quiz-result--correct' : 'quiz-result--wrong'}`}
                    >
                        <div className="quiz-result-header">
                            <span className="quiz-result-icon">{isCorrect() ? '정답' : '오답'}</span>
                            <span className="quiz-result-answer">
                                정답:{' '}
                                {currentQuiz.type === 'ox'
                                    ? currentQuiz.answer
                                        ? 'O'
                                        : 'X'
                                    : currentQuiz.type === 'choice'
                                        ? `${(currentQuiz.answer as number) + 1}번`
                                        : currentQuiz.answer}
                            </span>
                        </div>
                        <div className="quiz-result-explanation">
                            <MarkdownRenderer content={currentQuiz.explanation} />
                        </div>
                    </div>
                )}
            </div>

            {/* 네비게이션 */}
            <div className="quiz-nav">
                <Button variant="ghost" disabled={currentIndex === 0} onClick={handlePrev}>
                    이전
                </Button>
                <Button variant="ghost" disabled={currentIndex === quizzes.length - 1} onClick={handleNext}>
                    다음
                </Button>
            </div>

            {/* 다시 생성 */}
            <div className="quiz-regenerate">
                <Button variant="secondary" size="sm" loading={loading} onClick={handleRegenerate}>
                    새로운 퀴즈 생성
                </Button>
            </div>
        </div>
    );
}
