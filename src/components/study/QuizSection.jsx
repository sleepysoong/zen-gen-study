/**
 * QuizSection - 퀴즈 컴포넌트
 */
import { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import './QuizSection.css';

export function QuizSection({ quizzes, loading, onGenerate }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResults, setShowResults] = useState({});
    const [shortAnswers, setShortAnswers] = useState({});

    if (!quizzes || quizzes.length === 0) {
        return (
            <div className="quiz-section">
                <div className="quiz-empty">
                    <h3 className="quiz-empty-title">퀴즈로 복습해보세요</h3>
                    <p className="quiz-empty-description">
                        영상 내용을 기반으로 O/X 문제와 단답형 문제를 생성해요.
                    </p>
                    <Button
                        variant="primary"
                        loading={loading}
                        onClick={onGenerate}
                    >
                        퀴즈 생성하기
                    </Button>
                </div>
            </div>
        );
    }

    const quiz = quizzes[currentIndex];
    const isOX = quiz.type === 'ox';
    const isAnswered = answers[currentIndex] !== undefined || showResults[currentIndex];

    const handleOXAnswer = (answer) => {
        setAnswers({ ...answers, [currentIndex]: answer });
        setShowResults({ ...showResults, [currentIndex]: true });
    };

    const handleShortAnswer = () => {
        setShowResults({ ...showResults, [currentIndex]: true });
    };

    const isCorrect = () => {
        if (isOX) {
            return answers[currentIndex] === quiz.answer;
        }
        // 단답형은 정확한 일치 또는 포함 여부로 판단
        const userAnswer = (shortAnswers[currentIndex] || '').trim().toLowerCase();
        const correctAnswer = quiz.answer.toLowerCase();
        return userAnswer === correctAnswer || correctAnswer.includes(userAnswer);
    };

    const goToNext = () => {
        if (currentIndex < quizzes.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const resetQuiz = () => {
        setCurrentIndex(0);
        setAnswers({});
        setShowResults({});
        setShortAnswers({});
    };

    return (
        <div className="quiz-section">
            {/* 진행률 표시 */}
            <div className="quiz-progress">
                <div className="quiz-progress-bar">
                    <div
                        className="quiz-progress-fill"
                        style={{ width: `${((currentIndex + 1) / quizzes.length) * 100}%` }}
                    />
                </div>
                <span className="quiz-progress-text">
                    {currentIndex + 1} / {quizzes.length}
                </span>
            </div>

            {/* 퀴즈 카드 */}
            <div className="quiz-card">
                <div className="quiz-type-badge">
                    {isOX ? 'O/X 문제' : '단답형 문제'}
                </div>

                <div className="quiz-question">
                    <MarkdownRenderer content={quiz.question} />
                </div>

                {/* O/X 답변 버튼 */}
                {isOX && (
                    <div className="quiz-ox-buttons">
                        <button
                            className={`quiz-ox-btn quiz-ox-btn--o ${answers[currentIndex] === true ? 'quiz-ox-btn--selected' : ''
                                } ${showResults[currentIndex] && quiz.answer === true ? 'quiz-ox-btn--correct' : ''
                                } ${showResults[currentIndex] && answers[currentIndex] === true && quiz.answer !== true ? 'quiz-ox-btn--wrong' : ''
                                }`}
                            onClick={() => handleOXAnswer(true)}
                            disabled={isAnswered}
                        >
                            O
                        </button>
                        <button
                            className={`quiz-ox-btn quiz-ox-btn--x ${answers[currentIndex] === false ? 'quiz-ox-btn--selected' : ''
                                } ${showResults[currentIndex] && quiz.answer === false ? 'quiz-ox-btn--correct' : ''
                                } ${showResults[currentIndex] && answers[currentIndex] === false && quiz.answer !== false ? 'quiz-ox-btn--wrong' : ''
                                }`}
                            onClick={() => handleOXAnswer(false)}
                            disabled={isAnswered}
                        >
                            X
                        </button>
                    </div>
                )}

                {/* 단답형 입력 */}
                {!isOX && (
                    <div className="quiz-short-answer">
                        <Input
                            value={shortAnswers[currentIndex] || ''}
                            onChange={(e) => setShortAnswers({ ...shortAnswers, [currentIndex]: e.target.value })}
                            placeholder="답을 입력하세요"
                            disabled={showResults[currentIndex]}
                        />
                        {!showResults[currentIndex] && (
                            <Button
                                variant="primary"
                                onClick={handleShortAnswer}
                                disabled={!shortAnswers[currentIndex]?.trim()}
                            >
                                확인
                            </Button>
                        )}
                    </div>
                )}

                {/* 결과 및 해설 */}
                {showResults[currentIndex] && (
                    <div className={`quiz-result ${isCorrect() ? 'quiz-result--correct' : 'quiz-result--wrong'}`}>
                        <div className="quiz-result-header">
                            <span className="quiz-result-icon">
                                {isCorrect() ? '정답이에요!' : '틀렸어요'}
                            </span>
                            {!isOX && (
                                <span className="quiz-result-answer">
                                    정답: {quiz.answer}
                                </span>
                            )}
                        </div>
                        {quiz.explanation && (
                            <div className="quiz-explanation">
                                <MarkdownRenderer content={quiz.explanation} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 네비게이션 */}
            <div className="quiz-nav">
                <Button
                    variant="ghost"
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                >
                    이전
                </Button>
                <Button
                    variant="ghost"
                    onClick={resetQuiz}
                >
                    처음부터
                </Button>
                <Button
                    variant="ghost"
                    onClick={goToNext}
                    disabled={currentIndex === quizzes.length - 1}
                >
                    다음
                </Button>
            </div>

            {/* 다시 생성 버튼 */}
            <div className="quiz-regenerate">
                <Button
                    variant="secondary"
                    size="sm"
                    loading={loading}
                    onClick={onGenerate}
                >
                    새로운 퀴즈 생성
                </Button>
            </div>
        </div>
    );
}
